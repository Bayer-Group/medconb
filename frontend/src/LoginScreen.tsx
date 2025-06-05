import {styled} from '@linaria/react'
import {Button, Form, Input, Divider} from 'antd'
import React from 'react'
import CompanyLogo from '../assets/images/company_logo_color.png'
import MCBLogo from '../assets/images/MCBLogo@2x.png'

type PasswordLoginFormValues = {
  email: string
  password: string
}

type RegistrationFormValues = {
  email: string
  password: string
  confirm: string
  name: string
}

type LoginScreenProps = {
  loginOptions: {dev: boolean; msal: boolean; password: boolean}
  i18n: Record<string, string>
  handleMsalLogin: () => void
  handlePasswordLogin: (email: string, password: string) => void
  passwordLoginMessage?: string
  handleRegister: (email: string, password: string, name: string) => void
  registrationMessage?: string
}
const LoginScreen: React.FC<LoginScreenProps> = ({
  loginOptions,
  i18n,
  handleMsalLogin,
  handlePasswordLogin,
  passwordLoginMessage,
  handleRegister,
  registrationMessage,
}) => {
  const [form] = Form.useForm()
  const [registerForm] = Form.useForm()
  const [isRegister, setIsRegister] = React.useState(false)

  const _handleEmailLogin = (values: PasswordLoginFormValues) => {
    handlePasswordLogin(values.email, values.password)
  }

  const _handleRegister = (values: RegistrationFormValues) => {
    if (values.password !== values.confirm) {
      registerForm.setFields([{name: 'confirm', errors: ['Passwords do not match!']}])
      return
    }
    handleRegister(values.email, values.password, values.name)
  }

  return (
    <LoginRoot>
      <div>
        <Box>
          <LogoContainer66px>
            <img height="100%" src={MCBLogo} />
          </LogoContainer66px>
          <Divider style={{margin: '16px 0'}} />
          {loginOptions.password && !isRegister && (
            <>
              <Form
                form={form}
                layout="horizontal"
                onFinish={_handleEmailLogin}
                labelCol={{span: 8}}
                wrapperCol={{span: 16}}>
                <Form.Item label="Email" name="email" rules={[{required: true, message: 'Please input your email!'}]}>
                  <Input type="email" placeholder="Enter your email" />
                </Form.Item>
                <Form.Item
                  label="Password"
                  name="password"
                  rules={[{required: true, message: 'Please input your password!'}]}>
                  <Input.Password placeholder="Enter your password" />
                </Form.Item>
                {passwordLoginMessage && (
                  <Form.Item wrapperCol={{span: 24}}>
                    <div style={{color: 'red', textAlign: 'center'}}>{passwordLoginMessage}</div>
                  </Form.Item>
                )}
                <Form.Item wrapperCol={{span: 24}} style={{textAlign: 'center', marginBottom: 0}}>
                  <Button type="primary" htmlType="submit">
                    Sign in with Password
                  </Button>
                </Form.Item>
                <Form.Item wrapperCol={{span: 24}} style={{textAlign: 'center', marginBottom: 0}}>
                  <Button type="link" onClick={() => setIsRegister(true)}>
                    Register new account
                  </Button>
                </Form.Item>
              </Form>
              <Divider style={{margin: '16px 0'}} />
            </>
          )}
          {loginOptions.password && isRegister && (
            <>
              <Form
                form={registerForm}
                layout="horizontal"
                onFinish={_handleRegister}
                labelCol={{span: 8}}
                wrapperCol={{span: 16}}>
                <Form.Item
                  initialValue="Bob"
                  label="Name"
                  name="name"
                  rules={[{required: true, message: 'Please input your name!'}]}>
                  <Input type="text" placeholder="Enter your name" />
                </Form.Item>
                <Form.Item
                  initialValue="bob@example.com"
                  label="Email"
                  name="email"
                  rules={[{required: true, message: 'Please input your email!'}]}>
                  <Input type="email" placeholder="Enter your email" />
                </Form.Item>
                <Form.Item
                  initialValue="123"
                  label="Password"
                  name="password"
                  rules={[{required: true, message: 'Please input your password!'}]}>
                  <Input.Password placeholder="Enter your password" />
                </Form.Item>
                <Form.Item
                  initialValue="123"
                  label="Confirm"
                  name="confirm"
                  dependencies={['password']}
                  rules={[{required: true, message: 'Please confirm your password!'}]}>
                  <Input.Password placeholder="Confirm your password" />
                </Form.Item>
                {registrationMessage && (
                  <Form.Item wrapperCol={{span: 24}}>
                    <div style={{color: 'red', textAlign: 'center'}}>{registrationMessage}</div>
                  </Form.Item>
                )}
                <Form.Item wrapperCol={{span: 24}} style={{textAlign: 'center', marginBottom: 0}}>
                  <Button type="primary" htmlType="submit">
                    Register
                  </Button>
                </Form.Item>
                <Form.Item wrapperCol={{span: 24}} style={{textAlign: 'center', marginBottom: 0}}>
                  <Button type="link" onClick={() => setIsRegister(false)}>
                    Back to Login
                  </Button>
                </Form.Item>
              </Form>
              <Divider style={{margin: '16px 0'}} />
            </>
          )}
          {loginOptions.msal && !isRegister && (
            <>
              <LogoContainer100px>
                <img height="100%" src={CompanyLogo} />
              </LogoContainer100px>
              <Button type="primary" onClick={handleMsalLogin} block>
                Sign in using your {i18n.companyName} account
              </Button>
              <Divider style={{margin: '16px 0'}} />
            </>
          )}
          {loginOptions.dev && !isRegister && (
            <Button block type="text" onClick={() => (document.location.href = '?dev_auth=1')}>
              Sign in using dev token
            </Button>
          )}
        </Box>
      </div>
    </LoginRoot>
  )
}

export default LoginScreen

const LoginRoot = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
`
const Box = styled.div`
  background: #f1f2f5;
  border: 1px solid #f1f2f5;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  padding: 20px;
  justify-content: center;

  > .ant-divider:last-child {
    display: none;
  }
`

const LogoContainer100px = styled.div`
  height: 100px;
  text-align: center;
  margin-bottom: 20px;
`

const LogoContainer66px = styled.div`
  height: 66px;
  text-align: center;
  margin-bottom: 20px;
`
