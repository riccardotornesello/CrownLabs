import { useTenantLazyQuery, type TenantQuery } from '../../generated-types';
import Box from '../common/Box';
import TenantSearchForm from './TenantSearchForm';
import { Button, Tooltip } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { useState } from 'react';
import TenantPersonalWorkspaceSettings from './TenantPersonalWorkspaceSettings';

export default function TenantsView() {
  const [tenant, setTenant] = useState<TenantQuery | undefined>(undefined);

  const [loadTenant, { loading }] = useTenantLazyQuery({
    onCompleted: data => setTenant(data),
  });

  const tenantLoaded = tenant !== undefined;

  const goBack = () => {
    setTenant(undefined);
  };

  return (
    <Box
      header={{
        size: 'middle',
        left: (
          <div className="h-full flex-none flex justify-center items-center w-20">
            {tenantLoaded && (
              <Tooltip title="Back">
                <Button
                  type="primary"
                  shape="circle"
                  size="large"
                  icon={<LeftOutlined />}
                  onClick={goBack}
                ></Button>
              </Tooltip>
            )}
          </div>
        ),
        right: (
          <div className="h-full flex-none flex justify-center items-center w-20"></div>
        ),
        center: (
          <div className="h-full flex justify-center items-center px-5">
            <p className="md:text-2xl text-lg text-center mb-0">
              <b>Manage tenant</b>
            </p>
          </div>
        ),
      }}
    >
      <TenantPersonalWorkspaceSettings tenant={tenant!} />

      {tenantLoaded ? (
        <pre>{JSON.stringify(tenant, null, 2)}</pre>
      ) : (
        <div className="max-w-lg mx-auto mt-4">
          <TenantSearchForm
            isLoading={loading}
            onSearch={tenantId => loadTenant({ variables: { tenantId } })}
          />
        </div>
      )}
    </Box>
  );
}
