import { NextResponse } from 'next/server'
import { processingState } from '../process-queries/route'

export async function POST(): Promise<NextResponse> {
  try {
    // Parar processamento se estiver rodando
    processingState.isProcessing = false
    processingState.isPaused = false
    
    // Resetar todos os dados
    processingState.currentIndex = 0
    processingState.data = []
    processingState.results = []
    processingState.stats = {
      total: 0,
      processed: 0,
      success: 0,
      errors: 0,
      current: '',
      eta: '',
      remaining: 0
    }
    processingState.logs = []
    processingState.startTime = 0
    processingState.cadence = 4
    processingState.lastUpdateTime = 0
    processingState.isStuck = false
    processingState.stuckDetectionStartTime = 0
    processingState.sessionActive = false
    processingState.planilhaValidada = false
    
    // Adicionar log de reset
    const log = {
      type: 'info' as const,
      message: 'Sistema reiniciado - todos os dados foram limpos',
      timestamp: new Date().toISOString(),
      step: 'Sistema',
      status: 'concluído' as const
    }
    processingState.logs.unshift(log)
    
    return NextResponse.json({
      success: true,
      message: 'Sistema reiniciado com sucesso'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao reiniciar sistema'
    })
  }
}