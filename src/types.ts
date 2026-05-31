export interface ReasoningStep {
  id: string;
  type: 'analysis' | 'question' | 'hypothesis' | 'evidence' | 'failure_analysis' | 'investigator' | 'critic' | 'verdict';
  title: string;
  content: string;
  confidence: number;
  timestamp: number;
}

export interface DocumentAssimilation {
  documentProfile: {
    type: string;
    mainThesis: string;
  };
  contextualAnchors: {
    category: string;
    value: string;
  }[];
  knowledgeGaps: string[];
}

export interface Hypothesis {
  id: string;
  statement: string;
  rationale: string;
  noveltyScore: number;
  sourceQuotes?: string[];
  phenomenologicalTranslation?: string;
  biomimeticInspiration?: string;
  boundaryConditionCheck?: string;
  experimentumCrucis?: string;
}

export interface CriticEvaluation {
  hypothesisId: string;
  status: 'survived' | 'rejected';
  critique: string;
  documentFidelityScore?: number;
}

export interface AttachedFile {
  name: string;
  mimeType: string;
  data: string; // base64 string
  processed?: boolean;
}

export interface KnowledgeConnection {
  pastTopic: string;
  extractedInsight: string;
  applicationToCurrent: string;
  connectionType: 'directa' | 'serendipia' | 'documento';
}

export interface TribunalResult {
  topic: string;
  documentSummary?: string;
  documentAssimilation?: DocumentAssimilation;
  methodologicalAnalysis?: {
    studyDesign: string;
    sampleSize?: string;
    biasRisk: 'bajo' | 'moderado' | 'alto';
    limitations: string[];
  };
  statisticalReview?: {
    keyMetrics: {
      metric: string;
      value: string;
      significance?: string;
    }[];
    interpretation: string;
  };
  investigatorHypotheses: Hypothesis[];
  evaluations: CriticEvaluation[];
  survivingHypotheses: Hypothesis[];
  futureDirections?: {
    proposedStudy: string;
    objective: string;
    methodology: string;
  }[];
  ethicalConsiderations?: {
    conflictsOfInterest: string;
    fundingSources: string;
    ethicalApproval: string;
  };
  summary: string;
  connections: KnowledgeConnection[];
}

export interface CognitiveAutopsy {
  etiqueta_diagnostica: string;
  hipotesis_inicial: string;
  trampa_clinica: string;
  evidencia_correccion: string;
  verdad_revelada: string;
  aforismo_medico: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'system' | 'assistant';
  content: string;
  timestamp: number;
  isError?: boolean;
  isAction?: boolean;
  connections?: KnowledgeConnection[];
  newDiscovery?: {
    etiqueta_diagnostica: string;
    hallazgo: string;
  };
  cognitiveAutopsy?: CognitiveAutopsy;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rating?: number;
  note?: string;
}

export interface ClinicalResult {
  topic: string;
  patientProfile?: {
    demographics: string;
    chiefComplaint: string;
    pastMedicalHistory: string[];
    socialHistory?: string;
    comorbidities: string[];
  };
  historicalAuditor?: {
    anchorMatch: string;
    congruence: string;
    divergence: string;
  };
  physicalExam?: {
    vitals: {
      bp?: string;
      hr?: string;
      rr?: string;
      temp?: string;
      spo2?: string;
    };
    findings: {
      system: string;
      observation: string;
    }[];
  };
  laboratoryData?: {
    test: string;
    value: string;
    unit: string;
    referenceRange?: string;
    interpretation: 'normal' | 'anormal' | 'crítico';
  }[];
  extractedClinicalText?: string;
  radiologicalSigns?: {
    sign: string;
    present: boolean;
    description: string;
  }[];
  diagnosticFindings?: {
    modality: string;
    findings: string[];
    interpretation: string;
    technicalDetails?: {
      specificParameters?: { name: string; value: string }[];
      anatomicalSpecifics?: string;
      measurements?: string;
      riskMarkers?: string[];
    };
  }[];
  syndromes: string[];
  confoundingFactors?: {
    factor: string;
    impact: string;
  }[];
  absentSignsAnalysis?: {
    sign: string;
    expectedIn: string;
    clinicalSignificance: string;
  }[];
  differentialDiagnoses: {
    condition: string;
    probability: 'alta' | 'media' | 'baja';
    rationale: string;
    differentialExclusion?: string;
  }[];
  redFlags: {
    condition: string;
    rationale: string;
  }[];
  prognosticScores?: {
    name: string;
    score: string;
    interpretation: string;
    mortalityRisk?: string;
    missingData?: string;
    sepsisScore?: {
      qSOFA?: string;
      SIRS?: string;
      NEWS2?: string;
    };
  }[];
  interventionPriority?: {
    actionZero: string;
    rationale: string;
    urgency: 'inmediata' | 'alta' | 'moderada';
  };
  systemicIntegration?: {
    unifiedDiagnosis: string;
    pathophysiologicalConnection: string;
  };
  workup: {
    category: string;
    tests: string[];
    rationale: string;
  }[];
  treatment: {
    phase: string;
    interventions: string[];
    contraindications?: string[];
    interactions?: string[];
    rationale: string;
  }[];
  contingencyPlan?: {
    criticalMonitoring: string[];
    rescueInterventions: {
      trigger: string;
      intervention: string;
    }[];
  };
  disposition?: {
    levelOfCare: string;
    admissionCriteria: string[];
    dischargeCriteria: string[];
  };
  clinicalEvolution?: {
    phase: string;
    status: 'mejoría' | 'estabilidad' | 'deterioro' | 'resolución' | 'complicación';
    observations: string;
    prognosis: string;
  }[];
  ethicalLegalConsiderations?: {
    aspect: string;
    recommendation: string;
  }[];
  summary: string;
  evaluations?: CriticEvaluation[];
  boardSummary?: string;
  redTeamAudit?: {
    missedMicroFindings: string;
    volumetryCritique: string;
    technicalCorrelationCritique: string;
    adjacentStructuresCritique?: string;
    epidemiologicalCritique?: string;
    dataIntegrityCritique?: string;
    biomechanicalAndVascularCritique?: string;
    artifactAndBlindSpotsCritique?: string;
    benignityBiasCritique?: string;
    overMedicalizationCritique?: string;
  };
  clinicalSignificanceGrouping?: {
    criticalFindings: string[];
    relevantIncidentalFindings: string[];
    nonSignificantFindings: string[];
  };
  temporalComparison?: {
    growthDeltaPercent?: number;
    timeSpanMonths?: number;
    previousMeasurement?: string;
    currentMeasurement?: string;
    stabilityAssessment: 'estable' | 'progresion_lenta' | 'progresion_rapida' | 'indeterminada';
    stabilityRationale: string;
  };
}

export interface ImmunologyResult {
  topic: string;
  molecularProfile: {
    pathogenOrTarget: string;
    targetProteins: string[];
    mutationRisk: 'bajo' | 'medio' | 'alto' | 'crítico';
    virulenceFactors: string[];
    crossReactivity?: string[];
    hlaAssociations?: string[];
    selfAntigenSimilarity?: string; // Para autoinmunidad
  };
  innateImmunity: {
    barrierStatus: string;
    complementSystem: string;
    phagocyticActivity: string;
    patternRecognition: string[]; // TLRs, NLRs
    rationale: string;
  };
  antigenRecognition: {
    epitopes: string[];
    bindingAffinity: 'débil' | 'moderada' | 'fuerte';
    rationale: string;
  }[];
  immuneResponse: {
    cellType: string;
    activationLevel: string;
    cytokineProfile: string[];
    humoralResponse?: {
      antibodyIsotypes: string[];
      neutralizationCapacity: string;
      memoryBcellPotential: string;
    };
    cellularResponse?: {
      cytotoxicityLevel: string;
      tCellPolarization: string; // Th1, Th2, Th17, Treg
      exhaustionMarkers?: string[];
    };
    rationale: string;
    cytokineStormRisk?: {
      riskLevel: 'bajo' | 'medio' | 'alto' | 'crítico';
      predictedMarkers: string[];
      clinicalImplications: string;
    };
    immuneEvasion?: {
      mechanisms: string[];
      impactOnMemory: string;
    };
  }[];
  tumorSurveillance?: {
    neoantigenLoad: string;
    immuneCheckpointStatus: string; // PD-1, CTLA-4
    microenvironmentType: 'inflamado' | 'excluido' | 'desierto';
    metabolicEnvironment?: {
      hypoxiaLevel: string;
      lactateConcentration: string;
      phStatus: string;
    };
    tertiaryLymphoidStructures?: {
      presence: boolean;
      maturity: string;
      impact: string;
    };
    rationale: string;
  };
  autoimmunityRisk?: {
    targetOrgans: string[];
    molecularMimicryPotential: string;
    toleranceBreakdownMechanism: string;
    riskLevel: 'bajo' | 'medio' | 'alto' | 'crítico';
    rationale: string;
  };
  adaptiveSynapse?: {
    coStimulatorySignals: string[];
    inhibitorySignals: string[];
    synapseStability: string;
    antigenPresentationEfficiency: string;
  };
  vaccineSimulation: {
    strategy: string;
    predictedEfficacy: number;
    escapeVariants: string[];
    targetedTherapies?: string[];
    rationale: string;
  }[];
  cohortImpact?: {
    herdImmunityThreshold: string;
    populationVulnerability: string;
    recommendedSurveillance: string;
  };
  summary: string;
}

export interface EpidemiologyResult {
  regionProfile: {
    location: string;
    populationAtRisk: string | number;
    epidemiologicalWeek?: string;
    incidenceRate?: string;
    prevalenceRate?: string;
    demographicContext?: string;
  };
  outbreakDynamics?: {
    basicReproductionNumber?: number | string;
    transmissionVectors: string[];
    epidemicCurveTrend: 'crecimiento_exponencial' | 'crecimiento_lineal' | 'meseta' | 'declive' | 'indeterminado';
    rationale: string;
  };
  genomicEpidemiology?: {
    variantsOrSerotypes: string[];
    mutationRateAnalysis?: string;
    transmissionAdvantage?: string;
    impactOnDiagnostics?: string;
    impactOnTherapeutics?: string;
  };
  environmentalFactors: {
    factor: string;
    impact: 'facilitador' | 'barrera' | 'neutral';
    description: string;
  }[];
  populationVulnerability: {
    groupOrZone: string;
    riskFactor: string;
    vulnerabilityScore: 'baja' | 'media' | 'alta' | 'crítica';
    rationale: string;
  }[];
  socioeconomicImpact?: {
    economicBurden: string;
    laborProductivityImpact: string;
    socialInequityFactor: string;
    educationalImpact?: string;
  };
  healthcareSystemImpact: {
    resourceType: string;
    currentStatus: 'holgado' | 'tensión' | 'saturado' | 'colapso';
    rationale: string;
  }[];
  riskAnalysis: {
    currentThreats: {
      condition: string;
      riskLevel: 'bajo' | 'medio' | 'alto' | 'crítico';
      rationale: string;
    }[];
    futurePredictions: {
      potentialCondition: string;
      timeframe: string;
      probability: number;
      rationale: string;
    }[];
  };
  resourceOptimization: {
    resourceType: string;
    recommendedAllocation: string;
    urgency: 'baja' | 'media' | 'alta' | 'inmediata';
    rationale: string;
  }[];
  scenarioSimulation: {
    scenario: string;
    predictedOutcome: string;
    impactLevel: 'positivo' | 'neutral' | 'negativo' | 'catastrófico';
  }[];
  preventiveMeasures: {
    action: string;
    priority: 'baja' | 'media' | 'alta' | 'inmediata';
    rationale: string;
  }[];
  riskCommunication: {
    targetAudience: string;
    keyMessage: string;
    mediaChannels: string[];
  }[];
  policyRecommendations?: {
    recommendation: string;
    legalFramework?: string;
    implementationDifficulty: 'baja' | 'media' | 'alta';
    expectedOutcome: string;
  }[];
  epidemicProjection?: {
    timeUnit: string;
    dataPoints: {
      time: string;
      projectedCases: number;
    }[];
    description: string;
  };
  surveillanceAlerts: {
    level: 'info' | 'warning' | 'critical';
    message: string;
    trigger: string;
  }[];
  summary: string;
}

export interface Patient {
  dni: string;
  name: string;
  age: string;
  city: string;
  birthdate?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ArchivedReport {
  id: string;
  patientDni: string;
  date: number;
  type: 'clinical' | 'investigator' | 'immunology' | 'epidemiology_macro';
  topic: string;
  summary: string;
  fullData: any; // The full result object
  attachedFiles?: AttachedFile[]; // Keep image persistence
  usuario_id?: string; // Propiedad para control de acceso al borrar
}

export interface DeltaAnalysisResult {
  patientDni: string;
  patientName: string;
  comparisonPeriod: string;
  improvements: string[];
  worsenings: string[];
  stableConditions: string[];
  treatmentCorrelations: {
    treatment: string;
    effect: string;
    timeline: string;
  }[];
  trajectoryData: {
    date: string;
    metric: string;
    value: number;
    milestone?: string;
  }[];
  trajectoryAnalysis?: string;
  predictiveAlerts: string[];
  interventionPriority?: {
    actionZero: string;
    rationale: string;
    urgency: 'inmediata' | 'alta' | 'moderada';
  };
  sepsisRiskScore?: {
    score: string;
    interpretation: string;
    trend: 'estable' | 'ascendente' | 'descendente';
  };
  executiveSummary: string;
}

export interface Session {
  id: string;
  title: string;
  topic: string;
  createdAt: number;
  updatedAt: number;
  mode?: 'investigator' | 'clinical' | 'epidemiology_macro' | 'immunology';
  isSocraticMode?: boolean;
  isDebateMode?: boolean;
  isDeltaMode?: boolean;
  tribunalResult: TribunalResult | null;
  clinicalResult?: ClinicalResult | null;
  epidemiologyResult?: EpidemiologyResult | null;
  immunologyResult?: ImmunologyResult | null;
  deltaResult?: DeltaAnalysisResult | null;
  chatHistory: ChatMessage[];
  embedding?: number[];
  attachedFiles?: AttachedFile[];
  isPinned?: boolean;
  pendingTransitionContext?: string;
}
