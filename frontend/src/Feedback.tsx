import {MessageOutlined} from '@ant-design/icons'
import {Button, FloatButton, Form, Input, Popover} from 'antd'
import {useContext} from 'react'
import {ApplicationContext} from './ApplicationProvider'

const {TextArea} = Input

const Feedback = () => {
  return (
    <Popover placement="topRight" arrow={false} content={<FeedbackForm />} trigger="click">
      <FloatButton icon={<MessageOutlined />} type="primary" onClick={() => console.log('click')} />
    </Popover>
  )
}

const FeedbackForm = () => {
  const [form] = Form.useForm()
  const {config} = useContext(ApplicationContext)

  const handleSumbit = (values: any) => {
    const message = `### ${values.title}%0D%0D%0D${values.message.replace(/\n/g, '%0D')}
    `
    window.open(`mailto:${config.i18n.feedbackEmail}?subject=Feedback via MedConB Feedback Form&body=${message}`)
    form.resetFields()
  }

  return (
    <div style={{width: 300}}>
      <Form form={form} onFinish={handleSumbit} layout="vertical">
        <Form.Item name="title" label="Title" rules={[{required: true}]} tooltip="This is a required field">
          <Input size="small" />
        </Form.Item>
        <Form.Item name="message" label="Message" rules={[{required: true}]} tooltip="This is a required field">
          <TextArea size="small" rows={6} />
        </Form.Item>
        <Form.Item>
          <Button size="small" type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default Feedback
