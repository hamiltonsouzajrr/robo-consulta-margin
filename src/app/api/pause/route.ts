import { NextResponse } from 'next/server'
import { processingState } from '../process-queries/route'

export async function POST(): Promise<NextResponse> {
  try {
    if (!processingState.isProcessing) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum processamento em andamento'
      })
    }

    // Pausar o processamento
    processingState.isPaused = true
    
    // Limpar interval se existir
    if (processingState.processingInterval) {
      clearTimeout(processingState.processingInterval)
      processingState.processingInterval = null
    }
    
    // Adicionar log
    const log = {
      type: 'warning',
      message: 'Processamento pausado pelo usuário',
      timestamp: new Date().toISOString(),
      step: 'Processamento',
      status: 'em andamento'
    }
    processingState.logs.unshift(log)
    
    return NextResponse.json({
      success: true,
      message: 'Processamento pausado com sucesso'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao pausar processamento'
    })
  }
}