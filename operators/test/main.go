package main

import (
	"context"
	"fmt"
	"sort"

	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	"k8s.io/klog/v2"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/metrics/server"

	"github.com/netgroup-polito/CrownLabs/operators/api/v1alpha1"
	"github.com/netgroup-polito/CrownLabs/operators/api/v1alpha2"
)

type PodReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

var (
	scheme = runtime.NewScheme()
)

func init() {
	utilruntime.Must(v1alpha1.AddToScheme(scheme))
	utilruntime.Must(v1alpha2.AddToScheme(scheme))
}

func (r *PodReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	klog.Info("Reconciling Instance for quota enforcement ", req.NamespacedName)

	// Get instances owned by the same Tenant
	var instanceList v1alpha2.InstanceList
	if err := r.List(ctx, &instanceList, client.InNamespace(req.Namespace)); err != nil {
		return ctrl.Result{}, err
	}

	// Group instances by workspace
	workspaceInstances := map[string][]v1alpha2.Instance{}
	for _, i := range instanceList.Items {
		if !i.DeletionTimestamp.IsZero() {
			continue
		}

		wsName := i.Labels["crownlabs.polito.it/workspace"] // TODO: use forge.LabelWorkspaceKey
		if wsName == "" {
			continue
		}

		instances, exists := workspaceInstances[wsName]
		if !exists {
			instances = []v1alpha2.Instance{}
		}
		instances = append(instances, i)
		workspaceInstances[wsName] = instances
	}

	// Get all the workspaces
	// TODO: get only the relevant ones?
	var wsList v1alpha1.WorkspaceList
	if err := r.List(ctx, &wsList); err != nil {
		return ctrl.Result{}, err
	}

	wsMap := map[string]v1alpha1.Workspace{}
	for _, w := range wsList.Items {
		wsMap[w.Name] = w
	}

	// For each workspace, calculate the used resources and enforce quotas
	for wsName, instances := range workspaceInstances {
		usedCPU := resource.MustParse("0")
		usedMem := resource.MustParse("0")
		usedInstances := int64(0)

		for _, instance := range instances {
			instanceTemplate := &v1alpha2.Template{}
			if err := r.Client.Get(ctx, types.NamespacedName{Namespace: instance.Spec.Template.Namespace, Name: instance.Spec.Template.Name}, instanceTemplate); err != nil {
				if errors.IsNotFound(err) {
					return ctrl.Result{}, fmt.Errorf("template not found for %s", instance.Name)
				}
				return ctrl.Result{}, fmt.Errorf("unable to get the template for %s: %v", instance.Name, err)
			}

			usedInstances++
			for _, environment := range instanceTemplate.Spec.EnvironmentList {
				usedCPU.Add(*resource.NewQuantity(int64(environment.Resources.CPU), resource.DecimalSI))
				usedMem.Add(environment.Resources.Memory)
			}
		}

		ws, exists := wsMap[wsName]
		if !exists {
			klog.Info("Workspace not found for quota enforcement", "workspace", wsName)
			continue
		}

		quota := ws.Spec.Quota

		// Sort instances by creation time (oldest first)
		sort.Slice(instances, func(i, j int) bool {
			return instances[i].CreationTimestamp.After(instances[j].CreationTimestamp.Time)
		})

		for _, instance := range instances {
			exceeded := false
			var reason string

			if quota.Instances > 0 && usedInstances > quota.Instances {
				exceeded = true
				reason = fmt.Sprintf("Instances (%d > %d)", usedInstances, quota.Instances)
			} else if !quota.CPU.IsZero() && usedCPU.Cmp(quota.CPU) > 0 {
				exceeded = true
				reason = fmt.Sprintf("CPU (%s > %s)", usedCPU.String(), quota.CPU.String())
			} else if !quota.Memory.IsZero() && usedMem.Cmp(quota.Memory) > 0 {
				exceeded = true
				reason = fmt.Sprintf("Memory (%s > %s)", usedMem.String(), quota.Memory.String())
			}

			if !exceeded {
				break
			}

			klog.Info("Exceeding quota, deleting instance", "instance", instance.Name, "workspace", wsName, "reason", reason)

			instanceTemplate := &v1alpha2.Template{}
			if err := r.Client.Get(ctx, types.NamespacedName{Namespace: instance.Spec.Template.Namespace, Name: instance.Spec.Template.Name}, instanceTemplate); err != nil {
				if errors.IsNotFound(err) {
					return ctrl.Result{}, fmt.Errorf("template not found for %s", instance.Name)
				}
				return ctrl.Result{}, fmt.Errorf("unable to get the template for %s: %v", instance.Name, err)
			}

			if err := r.Delete(ctx, &instance); err != nil {
				klog.Error(err, "Error deleting instance during quota enforcement", "instance", instance.Name)
				return ctrl.Result{}, err
			}

			// Update used resources
			usedInstances--
			for _, environment := range instanceTemplate.Spec.EnvironmentList {
				usedCPU.Sub(*resource.NewQuantity(int64(environment.Resources.CPU), resource.DecimalSI))
				usedMem.Sub(environment.Resources.Memory)
			}
		}
	}

	return ctrl.Result{}, nil
}

func (r *PodReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&v1alpha2.Instance{}).
		Complete(r)
}

func main() {
	//----------- MANAGER
	mgr, err := ctrl.NewManager(ctrl.GetConfigOrDie(), ctrl.Options{
		Scheme: scheme,
		Metrics: server.Options{
			BindAddress: ":8083",
		},
		HealthProbeBindAddress: ":8082",
		Logger:                 klog.Background(),
	})
	if err != nil {
		panic(err)
	}

	//---------- RECONCILER
	r := PodReconciler{
		Client: mgr.GetClient(),
		Scheme: mgr.GetScheme(),
	}

	if err = r.SetupWithManager(mgr); err != nil {
		panic(err)
	}

	//---------- START
	klog.Info("starting manager as controller manager")
	if err := mgr.Start(ctrl.SetupSignalHandler()); err != nil {
		panic(err)
	}
}
