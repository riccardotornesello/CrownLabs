import { Row, Col, Typography, Space } from 'antd';
import {
  DesktopOutlined,
  CloudOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import type { FC } from 'react';
import './QuotaDisplay.less';

const { Text } = Typography;

export interface IQuotaDisplayProps {
  consumedQuota?: {
    cpu?: number;
    memory?: number;
    instances?: number;
  } | null;
  workspaceQuota?: {
    cpu?: number;
    memory?: number;
    instances?: number;
  };
}

const QuotaDisplay: FC<IQuotaDisplayProps> = ({
  consumedQuota,
  workspaceQuota,
}) => {
  return (
    <div
      className="quota-display-container h-25 md:h-10 px-5"
      style={{ width: '100%', overflow: 'hidden' }}
    >
      <Row gutter={[16, 0]} style={{ height: '100%' }}>
        <Col xs={24} md={8} className='md:h-full'>
          <div
            className="quota-metric"
            style={{ height: '100%', display: 'flex', alignItems: 'center' }}
          >
            <Space size="small">
              <DesktopOutlined className="primary-color-fg" />
              <Text strong>
                {consumedQuota?.cpu || 0}/{workspaceQuota?.cpu || 0}
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                CPU cores
              </Text>
            </Space>
          </div>
        </Col>

        <Col xs={24} md={8} className='md:h-full'>
          <div
            className="quota-metric"
            style={{ height: '100%', display: 'flex', alignItems: 'center' }}
          >
            <Space size="small">
              <DatabaseOutlined className="success-color-fg" />
              <Text strong>
                {(consumedQuota?.memory || 0).toFixed(1)}/{(workspaceQuota?.memory || 0).toFixed(1)}
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                RAM GB
              </Text>
            </Space>
          </div>
        </Col>

        <Col xs={24} md={8} className='md:h-full'>
          <div
            className="quota-metric"
            style={{ height: '100%', display: 'flex', alignItems: 'center' }}
          >
            <Space size="small">
              <CloudOutlined className="warning-color-fg" />
              <Text strong>
                {consumedQuota?.instances || 0}/{workspaceQuota?.instances || 0}
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Instances
              </Text>
            </Space>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default QuotaDisplay;
