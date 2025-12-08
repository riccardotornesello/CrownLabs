set -e

kind delete clusters --all
kind create cluster

# KYVERNO
helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo update
helm install kyverno kyverno/kyverno -n kyverno --create-namespace

# KUBEVIRT
KUBEVIRT_VERSION=$(curl -s https://storage.googleapis.com/kubevirt-prow/release/kubevirt/kubevirt/stable.txt)
kubectl create -f "https://github.com/kubevirt/kubevirt/releases/download/${KUBEVIRT_VERSION}/kubevirt-operator.yaml"
kubectl create -f "https://github.com/kubevirt/kubevirt/releases/download/${KUBEVIRT_VERSION}/kubevirt-cr.yaml"

# CERT-MANAGER
helm upgrade --install \
  cert-manager oci://quay.io/jetstack/charts/cert-manager \
  --version v1.19.1 \
  --namespace cert-manager \
  --create-namespace \
  --set crds.enabled=true

# PROMETHEUS
helm upgrade --install \
  kube-prometheus-stack oci://ghcr.io/prometheus-community/charts/kube-prometheus-stack \
  --namespace=monitoring \
  --create-namespace

# CROWNLABS
kubectl apply -f operators/deploy/crds

# kubectl create namespace crownlabs-exam

# CROWNLABS_VERSION=$(git show-ref -s origin/master)
# helm dependency update deploy/crownlabs
# helm package deploy/crownlabs --app-version="${CROWNLABS_VERSION}"
# helm upgrade --install \
#   crownlabs crownlabs-*.tgz \
#   --namespace crownlabs-production \
#   --create-namespace \
#   --values config.yaml \
#   --set global.version="${CROWNLABS_VERSION}"
