import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'auth.refresh_tokens.store': { paramsTuple?: []; params?: {} }
    'auth.password_reset.forgot': { paramsTuple?: []; params?: {} }
    'auth.password_reset.reset': { paramsTuple?: []; params?: {} }
    'auth.invitations.accept': { paramsTuple?: []; params?: {} }
    'auth.invitations.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'invitations.invitations.store': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'auth.invitations.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'auth.invitations.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'auth.refresh_tokens.store': { paramsTuple?: []; params?: {} }
    'auth.password_reset.forgot': { paramsTuple?: []; params?: {} }
    'auth.password_reset.reset': { paramsTuple?: []; params?: {} }
    'auth.invitations.accept': { paramsTuple?: []; params?: {} }
    'invitations.invitations.store': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}