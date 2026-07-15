import type { IsoDateTime, Metadata } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'
import type { ProviderManager } from './providerRuntime'
import type { ProviderAdapterResolver } from './providerAdapter'
import {
  RegistrationValidationService,
  type ExecutionAuditRecordInput,
  type ExecutionDispatchInput,
  type ExecutionGatewayRequestInput,
  type ExecutionGatewayResponseInput,
  type ExecutionResponseStatus,
  type ProviderResolutionInput,
  type RegistrationDiagnostic,
} from './validation'

function now(): IsoDateTime {
  return new Date().toISOString()
}

export interface ExecutionRequestIdentity {
  requestId: string
  executionId: string
  sessionId: string
  correlationId: string
}

export interface ExecutionRequestMetadata {
  tenantId: string
  source: string
  createdBy: string
  createdAt: IsoDateTime
  tags: string[]
}

export interface ExecutionRequestContext {
  runtimeContext: Metadata
  memoryContext: Metadata
  businessBrainContext: Metadata
  workflowContext: Metadata
  reasoningContext: Metadata
  aiTeamContext: Metadata
  providerContext: Metadata
  userContext: Metadata
  tenantContext: Metadata
}

export interface ExecutionPromptPackage {
  promptId: string
  promptVersion: string
  promptBody: string
  systemInstructions: string[]
  developerInstructions: string[]
  userInstructions: string[]
}

export interface ExecutionProviderSelection {
  providerType: 'ai' | 'chat' | 'embedding' | 'image' | 'speech' | 'moderation'
  providerId?: string
  capabilityId?: string
  requiredModel?: string
  minVersion?: string
  allowDegraded?: boolean
}

export interface ExecutionAdapterSelection {
  adapterType: 'chat' | 'embedding' | 'image' | 'speech' | 'moderation'
  preferredAdapterId?: string
  requiredCapabilityId?: string
  requiredModel?: string
  minVersion?: string
  allowDegraded?: boolean
}

export interface ExecutionConstraints {
  maxTokens?: number
  maxOutputItems?: number
  hardLimitMs: number
  requireApproval: boolean
}

export interface ExecutionTimeoutPolicy {
  requestTimeoutMs: number
  connectTimeoutMs: number
}

export interface ExecutionRetryPolicy {
  maxAttempts: number
  backoffMs: number
  retryableStatusCodes: number[]
}

export interface ExecutionExpectedOutput {
  outputType: 'text' | 'vectors' | 'images' | 'audio' | 'moderation'
  schemaVersion: string
  validationRequirements: string[]
}

export interface ExecutionGatewayRequest {
  identity: ExecutionRequestIdentity
  metadata: ExecutionRequestMetadata
  context: ExecutionRequestContext
  promptPackage: ExecutionPromptPackage
  providerSelection: ExecutionProviderSelection
  adapterSelection: ExecutionAdapterSelection
  constraints: ExecutionConstraints
  timeoutPolicy: ExecutionTimeoutPolicy
  retryPolicy: ExecutionRetryPolicy
  expectedOutput: ExecutionExpectedOutput
}

export interface ProviderResolutionRecord {
  resolutionId: string
  requestId: string
  providerType: ExecutionProviderSelection['providerType']
  resolvedProviderId?: string
  resolvedAdapterId?: string
  resolvedModel?: string
  capabilityId?: string
  available: boolean
  versionCompatible: boolean
  createdAt: IsoDateTime
}

export interface DispatchRoute {
  executionRoute: string
  responseRoute: string
  failureRoute: string
}

export interface RetryPlan {
  maxAttempts: number
  attemptNumber: number
  nextRetryAt?: IsoDateTime
}

export interface ExecutionDispatchRecord {
  dispatchId: string
  requestId: string
  executionId: string
  providerResolutionId: string
  adapterResolutionId: string
  route: DispatchRoute
  retryPlan: RetryPlan
  createdAt: IsoDateTime
}

export interface ExecutionResponseMetadata {
  responseId: string
  requestId: string
  executionId: string
  createdAt: IsoDateTime
}

export interface ExecutionProviderMetadata {
  providerId?: string
  adapterId?: string
  model?: string
  providerVersion?: string
}

export interface ExecutionCostMetadata {
  currency: string
  estimatedInputCost: number
  estimatedOutputCost: number
  estimatedTotalCost: number
}

export interface ExecutionTimingMetadata {
  queuedAt: IsoDateTime
  dispatchedAt?: IsoDateTime
  completedAt?: IsoDateTime
  totalDurationMs?: number
}

export interface ExecutionAuditReference {
  auditId: string
}

export interface ExecutionDiagnostics {
  diagnosticId: string
  code: string
  message: string
  severity: 'info' | 'warning' | 'error'
  createdAt: IsoDateTime
  entityId?: string
  metadata?: Metadata
}

export interface ExecutionGatewayResponse {
  metadata: ExecutionResponseMetadata
  status: ExecutionResponseStatus
  validationStatus: 'not-validated' | 'validated' | 'invalid'
  providerMetadata: ExecutionProviderMetadata
  costMetadata: ExecutionCostMetadata
  timingMetadata: ExecutionTimingMetadata
  diagnostics: ExecutionDiagnostics[]
  auditReferences: ExecutionAuditReference[]
  placeholderOutput: Metadata
}

export interface ExecutionAuditRecord {
  auditId: string
  requestId: string
  executionId: string
  sessionId: string
  dispatchRecord: {
    dispatchId: string
    executionRoute: string
    responseRoute: string
    failureRoute: string
    attemptNumber: number
  }
  providerResolutionRecord: {
    resolutionId: string
    providerId?: string
    adapterId?: string
    model?: string
    capabilityId?: string
    versionCompatible: boolean
    available: boolean
  }
  validationRecord: {
    requestValidated: boolean
    dispatchValidated: boolean
    responseValidated: boolean
    auditValidated: boolean
  }
  approvalRecord: {
    required: boolean
    status: 'not-required' | 'pending' | 'approved' | 'rejected'
    approvedBy?: string
    approvedAt?: IsoDateTime
  }
  timeline: Array<{
    eventId: string
    eventType: string
    timestamp: IsoDateTime
    metadata?: Metadata
  }>
  createdAt: IsoDateTime
  metadata?: Metadata
}

export interface ExecutionSession {
  sessionId: string
  executionId: string
  tenantId: string
  createdAt: IsoDateTime
  updatedAt?: IsoDateTime
  requestIds: string[]
  status: 'open' | 'closed'
}

export interface ExecutionGatewayHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  totalRequests: number
  totalResponses: number
  activeSessions: number
  validationErrors: number
  lastUpdatedAt: IsoDateTime
}

export interface ExecutionDispatchHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  totalDispatches: number
  failureRouted: number
  retriesPlanned: number
  lastDispatchAt?: IsoDateTime
}

export interface ExecutionRoutingHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  requestRoutes: number
  responseRoutes: number
  failureRoutes: number
  unresolvedRoutes: number
}

export interface ExecutionAuditHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  totalAuditRecords: number
  invalidAuditRecords: number
  lastAuditAt?: IsoDateTime
}

export interface ExecutionGatewayFrameworkHealth {
  executionGatewayHealth: ExecutionGatewayHealth
  dispatchHealth: ExecutionDispatchHealth
  routingHealth: ExecutionRoutingHealth
  auditHealth: ExecutionAuditHealth
}

export class ExecutionSessionManager {
  private sessions: Map<string, ExecutionSession> = new Map()

  openSession(executionId: string, tenantId: string): ExecutionSession {
    const session: ExecutionSession = {
      sessionId: `execution-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      executionId,
      tenantId,
      createdAt: now(),
      requestIds: [],
      status: 'open',
    }

    this.sessions.set(session.sessionId, session)
    return session
  }

  addRequest(sessionId: string, requestId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw RuntimeError.executionRequest('Execution session not found for request tracking', { sessionId, requestId })
    }

    session.requestIds.push(requestId)
    session.updatedAt = now()
    this.sessions.set(sessionId, session)
  }

  closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw RuntimeError.executionRequest('Execution session not found for close', { sessionId })
    }

    session.status = 'closed'
    session.updatedAt = now()
    this.sessions.set(sessionId, session)
  }

  get(sessionId: string): ExecutionSession | undefined {
    return this.sessions.get(sessionId)
  }

  list(): ExecutionSession[] {
    return Array.from(this.sessions.values())
  }

  activeCount(): number {
    return this.list().filter((session) => session.status === 'open').length
  }
}

export class ExecutionRequestRouter {
  private requestRoutes = 0
  private failureRoutes = 0
  private unresolvedRoutes = 0

  route(
    request: ExecutionGatewayRequest,
    resolution: ProviderResolutionRecord
  ): DispatchRoute {
    this.requestRoutes += 1

    if (!resolution.resolvedProviderId || !resolution.resolvedAdapterId) {
      this.failureRoutes += 1
      this.unresolvedRoutes += 1
      return {
        executionRoute: 'execution/unresolved',
        responseRoute: 'response/unresolved',
        failureRoute: 'failure/unresolved',
      }
    }

    return {
      executionRoute: `execution/${request.providerSelection.providerType}/${resolution.resolvedProviderId}`,
      responseRoute: `response/${request.expectedOutput.outputType}`,
      failureRoute: `failure/${request.providerSelection.providerType}`,
    }
  }

  getStats(): { requestRoutes: number; failureRoutes: number; unresolvedRoutes: number } {
    return {
      requestRoutes: this.requestRoutes,
      failureRoutes: this.failureRoutes,
      unresolvedRoutes: this.unresolvedRoutes,
    }
  }
}

export class ExecutionResponseRouter {
  private responseRoutes = 0

  route(input: {
    request: ExecutionGatewayRequest
    dispatch: ExecutionDispatchRecord
    resolution: ProviderResolutionRecord
    auditId: string
  }): ExecutionGatewayResponse {
    this.responseRoutes += 1

    const completedAt = now()
    return {
      metadata: {
        responseId: `execution-response-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        requestId: input.request.identity.requestId,
        executionId: input.request.identity.executionId,
        createdAt: completedAt,
      },
      status: input.resolution.resolvedProviderId ? 'completed' : 'routing-failed',
      validationStatus: 'validated',
      providerMetadata: {
        providerId: input.resolution.resolvedProviderId,
        adapterId: input.resolution.resolvedAdapterId,
        model: input.resolution.resolvedModel,
      },
      costMetadata: {
        currency: 'USD',
        estimatedInputCost: 0,
        estimatedOutputCost: 0,
        estimatedTotalCost: 0,
      },
      timingMetadata: {
        queuedAt: input.request.metadata.createdAt,
        dispatchedAt: input.dispatch.createdAt,
        completedAt,
        totalDurationMs: Math.max(Date.parse(completedAt) - Date.parse(input.request.metadata.createdAt), 0),
      },
      diagnostics: [
        {
          diagnosticId: `execution-gateway-diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          code: 'EXECUTION_PLACEHOLDER_RESPONSE',
          message: 'Execution Gateway returned placeholder response only',
          severity: 'info',
          createdAt: completedAt,
          entityId: input.request.identity.requestId,
        },
      ],
      auditReferences: [{ auditId: input.auditId }],
      placeholderOutput: {
        mode: 'execution-gateway-placeholder',
        route: input.dispatch.route.executionRoute,
      },
    }
  }

  getResponseRouteCount(): number {
    return this.responseRoutes
  }
}

export class ExecutionAuditManager {
  private records: Map<string, ExecutionAuditRecord> = new Map()
  private invalidRecords = 0
  private lastAuditAt?: IsoDateTime

  constructor(
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  create(input: ExecutionAuditRecordInput): ExecutionAuditRecord {
    const auditValidation = this.validation.validateExecutionAudit(input)
    if (!auditValidation.valid) {
      this.invalidRecords += 1
      throw RuntimeError.executionAudit('Execution audit validation failed', {
        auditId: input.auditId,
        diagnosticsCount: auditValidation.diagnostics.length,
      })
    }

    const record: ExecutionAuditRecord = {
      ...input,
      createdAt: now(),
      timeline: input.timeline.map((entry) => ({
        ...entry,
        timestamp: entry.timestamp,
      })),
    }

    this.records.set(record.auditId, record)
    this.lastAuditAt = now()
    return record
  }

  get(auditId: string): ExecutionAuditRecord | undefined {
    return this.records.get(auditId)
  }

  list(): ExecutionAuditRecord[] {
    return Array.from(this.records.values())
  }

  getInvalidRecordCount(): number {
    return this.invalidRecords
  }

  getLastAuditAt(): IsoDateTime | undefined {
    return this.lastAuditAt
  }
}

export class ExecutionDispatcher {
  private dispatchRecords: Map<string, ExecutionDispatchRecord> = new Map()
  private providerResolutions: Map<string, ProviderResolutionRecord> = new Map()
  private failureRouted = 0
  private retriesPlanned = 0
  private lastDispatchAt?: IsoDateTime

  constructor(
    private providerManager: ProviderManager,
    private adapterResolver: ProviderAdapterResolver,
    private requestRouter: ExecutionRequestRouter,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  dispatch(request: ExecutionGatewayRequest): {
    resolution: ProviderResolutionRecord
    dispatch: ExecutionDispatchRecord
  } {
    const providerDescriptor = this.providerManager
      .discover()
      .find((candidate) => {
        if (candidate.type !== request.providerSelection.providerType) return false
        if (request.providerSelection.providerId && candidate.providerId !== request.providerSelection.providerId) return false
        if (!request.providerSelection.allowDegraded && candidate.availability !== 'available') return false
        return true
      })

    const selectedAdapter = this.adapterResolver.selectAdapter({
      type: request.adapterSelection.adapterType,
      preferredAdapterId: request.adapterSelection.preferredAdapterId,
      requiredCapabilityId: request.adapterSelection.requiredCapabilityId,
      requiredModel: request.adapterSelection.requiredModel,
      minVersion: request.adapterSelection.minVersion,
      allowDegraded: request.adapterSelection.allowDegraded,
    })

    const resolvedModel = selectedAdapter
      ? this.adapterResolver.resolveModel(selectedAdapter.adapterId, request.adapterSelection.requiredModel ?? '')
      : undefined

    const resolution: ProviderResolutionRecord = {
      resolutionId: `provider-resolution-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      requestId: request.identity.requestId,
      providerType: request.providerSelection.providerType,
      resolvedProviderId: providerDescriptor?.providerId,
      resolvedAdapterId: selectedAdapter?.adapterId,
      resolvedModel: resolvedModel ?? selectedAdapter?.supportedModels[0],
      capabilityId: request.providerSelection.capabilityId,
      available: providerDescriptor ? providerDescriptor.availability === 'available' : false,
      versionCompatible: true,
      createdAt: now(),
    }

    const providerResolutionInput: ProviderResolutionInput = {
      requestId: resolution.requestId,
      providerType: resolution.providerType,
      resolvedProviderId: resolution.resolvedProviderId,
      resolvedAdapterId: resolution.resolvedAdapterId,
      resolvedModel: resolution.resolvedModel,
      capabilityId: resolution.capabilityId,
      versionCompatible: resolution.versionCompatible,
      available: resolution.available,
    }

    const resolutionValidation = this.validation.validateExecutionProviderResolution(providerResolutionInput)
    if (!resolutionValidation.valid) {
      throw RuntimeError.dispatch('Execution provider resolution validation failed', {
        requestId: request.identity.requestId,
        diagnosticsCount: resolutionValidation.diagnostics.length,
      })
    }

    const route = this.requestRouter.route(request, resolution)
    const retryPlan: RetryPlan = {
      maxAttempts: request.retryPolicy.maxAttempts,
      attemptNumber: 1,
      nextRetryAt: request.retryPolicy.maxAttempts > 1 ? now() : undefined,
    }

    if (request.retryPolicy.maxAttempts > 1) {
      this.retriesPlanned += 1
    }

    const dispatch: ExecutionDispatchRecord = {
      dispatchId: `execution-dispatch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      requestId: request.identity.requestId,
      executionId: request.identity.executionId,
      providerResolutionId: resolution.resolutionId,
      adapterResolutionId: selectedAdapter?.adapterId ?? 'adapter-unresolved',
      route,
      retryPlan,
      createdAt: now(),
    }

    const dispatchInput: ExecutionDispatchInput = {
      dispatchId: dispatch.dispatchId,
      requestId: dispatch.requestId,
      executionId: dispatch.executionId,
      route: {
        providerResolutionId: dispatch.providerResolutionId,
        adapterResolutionId: dispatch.adapterResolutionId,
        executionRoute: dispatch.route.executionRoute,
        responseRoute: dispatch.route.responseRoute,
        failureRoute: dispatch.route.failureRoute,
      },
      retryPlan: {
        maxAttempts: dispatch.retryPlan.maxAttempts,
        attemptNumber: dispatch.retryPlan.attemptNumber,
        nextRetryAt: dispatch.retryPlan.nextRetryAt,
      },
    }

    const dispatchValidation = this.validation.validateExecutionDispatch(dispatchInput)
    if (!dispatchValidation.valid) {
      throw RuntimeError.dispatch('Execution dispatch validation failed', {
        requestId: request.identity.requestId,
        diagnosticsCount: dispatchValidation.diagnostics.length,
      })
    }

    if (route.executionRoute.startsWith('execution/unresolved')) {
      this.failureRouted += 1
    }

    this.providerResolutions.set(resolution.resolutionId, resolution)
    this.dispatchRecords.set(dispatch.dispatchId, dispatch)
    this.lastDispatchAt = now()

    return { resolution, dispatch }
  }

  listDispatchRecords(): ExecutionDispatchRecord[] {
    return Array.from(this.dispatchRecords.values())
  }

  listProviderResolutions(): ProviderResolutionRecord[] {
    return Array.from(this.providerResolutions.values())
  }

  getFailureRoutedCount(): number {
    return this.failureRouted
  }

  getRetriesPlannedCount(): number {
    return this.retriesPlanned
  }

  getLastDispatchAt(): IsoDateTime | undefined {
    return this.lastDispatchAt
  }
}

export class ExecutionGateway {
  private requests: Map<string, ExecutionGatewayRequest> = new Map()
  private responses: Map<string, ExecutionGatewayResponse> = new Map()
  private diagnostics: ExecutionDiagnostics[] = []
  private validationDiagnostics: RegistrationDiagnostic[] = []
  private lastUpdatedAt: IsoDateTime = now()

  constructor(
    private dispatcher: ExecutionDispatcher,
    private requestRouter: ExecutionRequestRouter,
    private responseRouter: ExecutionResponseRouter,
    private sessionManager: ExecutionSessionManager,
    private auditManager: ExecutionAuditManager,
    private validation: RegistrationValidationService = new RegistrationValidationService()
  ) {}

  submit(input: ExecutionGatewayRequestInput): ExecutionGatewayResponse {
    const requestValidation = this.validation.validateExecutionRequest(input)
    this.validationDiagnostics.push(...requestValidation.diagnostics)

    if (!requestValidation.valid) {
      throw RuntimeError.executionRequest('Execution request validation failed', {
        requestId: input.requestId,
        diagnosticsCount: requestValidation.diagnostics.length,
      })
    }

    const session = this.sessionManager.get(input.sessionId)
    if (!session) {
      throw RuntimeError.executionRequest('Execution session is not registered', {
        requestId: input.requestId,
        sessionId: input.sessionId,
      })
    }

    const request: ExecutionGatewayRequest = {
      identity: {
        requestId: input.requestId,
        executionId: input.executionId,
        sessionId: input.sessionId,
        correlationId: input.metadata.correlationId,
      },
      metadata: {
        tenantId: input.metadata.tenantId,
        source: input.metadata.source,
        createdBy: input.metadata.createdBy,
        createdAt: input.metadata.createdAt,
        tags: input.metadata.tags,
      },
      context: input.context,
      promptPackage: input.promptPackage,
      providerSelection: input.providerSelection,
      adapterSelection: input.adapterSelection,
      constraints: input.executionConstraints,
      timeoutPolicy: input.timeoutPolicy,
      retryPolicy: input.retryPolicy,
      expectedOutput: input.expectedOutput,
    }

    this.requests.set(request.identity.requestId, request)
    this.sessionManager.addRequest(request.identity.sessionId, request.identity.requestId)

    const dispatched = this.dispatcher.dispatch(request)

    const auditInput: ExecutionAuditRecordInput = {
      auditId: `execution-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      requestId: request.identity.requestId,
      executionId: request.identity.executionId,
      sessionId: request.identity.sessionId,
      dispatchRecord: {
        dispatchId: dispatched.dispatch.dispatchId,
        executionRoute: dispatched.dispatch.route.executionRoute,
        responseRoute: dispatched.dispatch.route.responseRoute,
        failureRoute: dispatched.dispatch.route.failureRoute,
        attemptNumber: dispatched.dispatch.retryPlan.attemptNumber,
      },
      providerResolutionRecord: {
        resolutionId: dispatched.resolution.resolutionId,
        providerId: dispatched.resolution.resolvedProviderId,
        adapterId: dispatched.resolution.resolvedAdapterId,
        model: dispatched.resolution.resolvedModel,
        capabilityId: dispatched.resolution.capabilityId,
        versionCompatible: dispatched.resolution.versionCompatible,
        available: dispatched.resolution.available,
      },
      validationRecord: {
        requestValidated: true,
        dispatchValidated: true,
        responseValidated: true,
        auditValidated: true,
      },
      approvalRecord: {
        required: request.constraints.requireApproval,
        status: request.constraints.requireApproval ? 'pending' : 'not-required',
      },
      timeline: [
        {
          eventId: `timeline-event-${Date.now()}-accepted`,
          eventType: 'request-accepted',
          timestamp: now(),
        },
        {
          eventId: `timeline-event-${Date.now()}-dispatched`,
          eventType: 'request-dispatched',
          timestamp: now(),
          metadata: {
            executionRoute: dispatched.dispatch.route.executionRoute,
          },
        },
      ],
    }

    const auditRecord = this.auditManager.create(auditInput)

    const response = this.responseRouter.route({
      request,
      dispatch: dispatched.dispatch,
      resolution: dispatched.resolution,
      auditId: auditRecord.auditId,
    })

    const responseInput: ExecutionGatewayResponseInput = {
      responseId: response.metadata.responseId,
      requestId: response.metadata.requestId,
      executionId: response.metadata.executionId,
      status: response.status,
      validationStatus: response.validationStatus,
      providerMetadata: response.providerMetadata,
      costMetadata: response.costMetadata,
      timingMetadata: response.timingMetadata,
      diagnostics: response.diagnostics.map((diagnostic) => diagnostic.code),
      auditReferences: response.auditReferences.map((reference) => reference.auditId),
      placeholderOutput: response.placeholderOutput,
    }

    const responseValidation = this.validation.validateExecutionResponse(responseInput)
    this.validationDiagnostics.push(...responseValidation.diagnostics)
    if (!responseValidation.valid) {
      throw RuntimeError.executionResponse('Execution response validation failed', {
        requestId: response.metadata.requestId,
        diagnosticsCount: responseValidation.diagnostics.length,
      })
    }

    this.responses.set(response.metadata.responseId, response)
    this.diagnostics.push(...response.diagnostics)
    this.lastUpdatedAt = now()

    return response
  }

  getResponse(responseId: string): ExecutionGatewayResponse | undefined {
    return this.responses.get(responseId)
  }

  listResponses(): ExecutionGatewayResponse[] {
    return Array.from(this.responses.values())
  }

  getHealth(): ExecutionGatewayFrameworkHealth {
    const validationErrors = this.validationDiagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
    const routingStats = this.requestRouter.getStats()

    return {
      executionGatewayHealth: {
        status: validationErrors > 0 ? 'degraded' : 'healthy',
        totalRequests: this.requests.size,
        totalResponses: this.responses.size,
        activeSessions: this.sessionManager.activeCount(),
        validationErrors,
        lastUpdatedAt: this.lastUpdatedAt,
      },
      dispatchHealth: {
        status: this.dispatcher.getFailureRoutedCount() > 0 ? 'degraded' : 'healthy',
        totalDispatches: this.dispatcher.listDispatchRecords().length,
        failureRouted: this.dispatcher.getFailureRoutedCount(),
        retriesPlanned: this.dispatcher.getRetriesPlannedCount(),
        lastDispatchAt: this.dispatcher.getLastDispatchAt(),
      },
      routingHealth: {
        status: routingStats.unresolvedRoutes > 0 ? 'degraded' : 'healthy',
        requestRoutes: routingStats.requestRoutes,
        responseRoutes: this.responseRouter.getResponseRouteCount(),
        failureRoutes: routingStats.failureRoutes,
        unresolvedRoutes: routingStats.unresolvedRoutes,
      },
      auditHealth: {
        status: this.auditManager.getInvalidRecordCount() > 0 ? 'degraded' : 'healthy',
        totalAuditRecords: this.auditManager.list().length,
        invalidAuditRecords: this.auditManager.getInvalidRecordCount(),
        lastAuditAt: this.auditManager.getLastAuditAt(),
      },
    }
  }
}
