import { Button, Form, Input, Row } from 'antd';
import type { FC } from 'react';

export interface ITenantSearchFormProps {
  onSearch: (tenantId: string) => void;
  isLoading?: boolean;
}

const TenantSearchForm: FC<ITenantSearchFormProps> = ({
  onSearch,
  isLoading = false,
}) => {
  const [form] = Form.useForm();

  const submitForm = ({ tenantId }: { tenantId: string }) => {
    onSearch(tenantId.trim().toLowerCase());
  };

  return (
    <div>
      <h2 className="md:text-2xl text-lg text-center mb-4">Search Tenant</h2>

      <Form
        form={form}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 24 }}
        onFinish={submitForm}
      >
        <Form.Item
          name="tenantId"
          label="Tenant ID"
          validateTrigger="onBlur"
          rules={[
            {
              required: true,
              message: 'ID required',
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item>
          <Row justify="end">
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading === true}
            >
              Search
            </Button>
          </Row>
        </Form.Item>
      </Form>
    </div>
  );
};

export default TenantSearchForm;
