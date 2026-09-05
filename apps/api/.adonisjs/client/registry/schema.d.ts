/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'auth.access_tokens.store': {
    methods: ["POST"]
    pattern: '/api/v1/auth/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.refresh_tokens.store': {
    methods: ["POST"]
    pattern: '/api/v1/auth/refresh'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/refresh_tokens_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/refresh_tokens_controller').default['store']>>>
    }
  }
  'auth.password_reset.forgot': {
    methods: ["POST"]
    pattern: '/api/v1/auth/forgot-password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/password_reset').requestPasswordResetValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/password_reset').requestPasswordResetValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['forgot']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['forgot']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.password_reset.reset': {
    methods: ["POST"]
    pattern: '/api/v1/auth/reset-password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/password_reset').resetPasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/password_reset').resetPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['reset']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['reset']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.invitations.accept': {
    methods: ["POST"]
    pattern: '/api/v1/auth/invitations/accept'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/invitation').acceptInvitationValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/invitation').acceptInvitationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invitations_controller').default['accept']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invitations_controller').default['accept']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.invitations.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/auth/invitations/:token'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/invitation').showInvitationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invitations_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invitations_controller').default['show']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'invitations.invitations.store': {
    methods: ["POST"]
    pattern: '/api/v1/invitations'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').createUserValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').createUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invitations_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invitations_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'profile.profile.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/account/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
    }
  }
  'profile.access_tokens.destroy': {
    methods: ["POST"]
    pattern: '/api/v1/account/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
    }
  }
}
