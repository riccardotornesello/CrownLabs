import { Button, Checkbox, Form, InputNumber, type FormInstance } from 'antd';
import { useState, type FC } from 'react';
import type { TenantQuery } from '../../generated-types';

export interface ITenantPersonalWorkspaceSettingsProps {
  tenant: TenantQuery;
}

const TenantPersonalWorkspaceSettings: FC<
  ITenantPersonalWorkspaceSettingsProps
> = ({ tenant }) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const [form] = Form.useForm();

  const submitForm = (data: any) => {
    console.log(data);
  };

  const numberValidator =
    (fieldName: string, minValue: number) => (f: FormInstance<any>) => {
      if (f.getFieldValue('enabled')) {
        return {
          validator(_: any, value: number) {
            if (value >= minValue) {
              return Promise.resolve();
            }
            return Promise.reject(
              new Error(`${fieldName} must be at least ${minValue}`),
            );
          },
        };
      } else {
        return {
          validator(_: any, _value: number) {
            return Promise.resolve();
          },
        };
      }
    };

  const onValuesChange = (data: any) => {
    if (data.enabled !== undefined) setIsEnabled(data.enabled);
  };

  return (
    <Form
      form={form}
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 24 }}
      onFinish={submitForm}
      onValuesChange={onValuesChange}
    >
      <Form.Item
        name="enabled"
        valuePropName="checked"
        label="Enabled"
        validateTrigger="onBlur"
      >
        <Checkbox />
      </Form.Item>

      <div className={isEnabled ? '' : 'hidden'}>
        <Form.Item
          name="cpu"
          label="CPU"
          validateTrigger="onBlur"
          rules={[numberValidator('CPU', 0)]}
        >
          <InputNumber min={0} />
        </Form.Item>

        <Form.Item
          name="memory"
          label="Memory (GB)"
          validateTrigger="onBlur"
          rules={[numberValidator('Memory', 0)]}
        >
          <InputNumber min={0} />
        </Form.Item>

        <Form.Item
          name="instances"
          label="Instances"
          validateTrigger="onBlur"
          rules={[numberValidator('Instances', 0)]}
        >
          <InputNumber min={0} />
        </Form.Item>
      </div>

      <Button type="primary" htmlType="submit">
        Save Settings
      </Button>
    </Form>
  );
};

export default TenantPersonalWorkspaceSettings;
