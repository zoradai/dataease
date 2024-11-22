export {}
declare global {
  interface Window {
    DataEaseBi: any
    _de_get_time_out: number
  }
  interface Fn<T = any> {
    (...arg: T[]): T
  }

  type Nullable<T> = T | null

  type ElRef<T extends HTMLElement = HTMLDivElement> = Nullable<T>

  type Recordable<T = any, K = string> = Record<K extends string | number | symbol ? K : string, T>

  type LocaleType = 'zh-CN' | 'en' | 'tw'

  type AxiosHeaders =
    | 'application/json'
    | 'application/x-www-form-urlencoded'
    | 'multipart/form-data'

  type AxiosMethod = 'get' | 'post' | 'delete' | 'put'

  type AxiosResponseType = 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'

  interface AxiosConfig {
    params?: any
    data?: any
    url?: string
    method?: AxiosMethod
    headersType?: string
    responseType?: AxiosResponseType
  }

  interface IResponse<T = any> {
    code: string | number
    data: T extends any ? T : T & any
    msg: string
  }

  type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
  }

  type JSONString<T> = string & {
    _: never
    __: T
  }

  interface JSON {
    stringify<T>(value: T): JSONString<T>
    parse<T>(text: JSONString<T>): T
  }

  type EditorTheme = 'plain' | 'dark' | 'light'
}
