import * as z from '@zod/mini'

const MsalConfig = z.object({
  auth: z.object({
    clientId: z.string(),
    authority: z.string(),
    redirectUri: z.string(),
  }),
  scopes: z.array(z.string()),
})

const ApplicationConfig = z.object({
  graphql_endpoints: z.array(z.string()),
  show_version: z._default(z.boolean(), false),
  loginOptions: z.object({
    dev: z._default(z.boolean(), false),
    password: z._default(z.boolean(), false),
    msal: z._default(z.boolean(), false),
  }),
  dev_token: z._default(z.nullish(z.string()), null),
  msal: z.optional(MsalConfig),
  maintenance_mode: z._default(z.boolean(), false),
  glitchtipDSN: z.string(),
  i18n: z.object({
    companyName: z.string(),
    feedbackEmail: z.string(),
  }),
})

export type ApplicationConfig = z.infer<typeof ApplicationConfig>
export type MsalConfig = z.infer<typeof MsalConfig>

let _config: ApplicationConfig

export const getConfig = (): ApplicationConfig => {
  if (!_config) {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open('GET', 'config/config.json', false)
    xmlHttp.send(null)
    const unparsedConfig = JSON.parse(xmlHttp.responseText)
    _config = ApplicationConfig.parse(unparsedConfig)
  }
  return _config
}

export const tryGetConfig = ():
  | {
      success: true
      config: ApplicationConfig
    }
  | {
      success: false
      error: Error
    } => {
  try {
    return {
      success: true,
      config: getConfig(),
    }
  } catch (error) {
    return {
      success: false,
      error: error as Error,
    }
  }
}
