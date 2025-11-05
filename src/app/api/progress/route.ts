import { NextResponse } from 'next/server'
import { processingState } from '../process-queries/route'

export async function GET(): Promise<NextResponse> {
  try {
    // Verificar se há logs novos
    const recentLogs = processingState.logs.slice(0, 15) // Últimos 15 logs
    
    // Calcular tempo médio por consulta
    const avgTimePerQuery = processingState.stats.processed > 0 ? 
      (Date.now() - processingState.startTime) / processingState.stats.processed / 1000 : 0
    
    // Verificar se processo está travado
    const now = Date.now()
    let isStuckDetected = false
    
    if (processingState.isProcessing && 
        processingState.stats.success === 0 && 
        processingState.stats.errors === 0 && 
        processingState.stats.processed === 0 &&
        processingState.startTime > 0 &&
        (now - processingState.startTime) > 15000) {
      isStuckDetected = true
    }
    
    // Verificar se há travamento persistente
    if (processingState.isProcessing && 
        processingState.lastUpdateTime > 0 &&
        (now - processingState.lastUpdateTime) > 60000) {
      isStuckDetected = true
    }
    
    // Obter dados da consulta atual para tela em tempo real
    let currentQuery = null
    if (processingState.isProcessing && processingState.currentIndex < processingState.data.length) {
      const currentRecord = processingState.data[processingState.currentIndex]
      if (currentRecord) {
        currentQuery = {
          cpf: currentRecord.CPF,
          matricula: currentRecord.Matricula,
          orgao: currentRecord.Orgao,
          status: 'processando', // Status padrão
          tempo: processingState.startTime > 0 ? (now - processingState.startTime) / 1000 : 0,
          tentativa: 1, // Padrão
          resultado: null
        }
        
        // Se há resultado recente, atualizar status
        if (processingState.results.length > 0) {
          const lastResult = processingState.results[processingState.results.length - 1]
          if (lastResult && lastResult.cpf_consultado === currentRecord.CPF) {
            currentQuery.status = lastResult.status === 'Sucesso' ? 'sucesso' : 'erro'
            currentQuery.tentativa = lastResult.tentativas || 1
            currentQuery.tempo = lastResult.tempo_execucao ? lastResult.tempo_execucao / 1000 : 0
            currentQuery.resultado = lastResult.status === 'Sucesso' ? 
              `Margem: R$ ${lastResult.margem_disponivel}` : 
              lastResult.erro
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      stats: {
        total: processingState.stats.total,
        processed: processingState.stats.processed,
        success: processingState.stats.success,
        errors: processingState.stats.errors,
        current: processingState.stats.current,
        eta: processingState.stats.eta,
        remaining: processingState.stats.remaining,
        avgTimePerQuery: avgTimePerQuery.toFixed(1),
        progressPercent: processingState.stats.total > 0 ? 
          ((processingState.stats.processed / processingState.stats.total) * 100).toFixed(1) : '0'
      },
      currentQuery,
      logs: recentLogs,
      completed: !processingState.isProcessing && processingState.stats.processed > 0,
      paused: processingState.isPaused,
      isStuck: isStuckDetected || processingState.isStuck,
      sessionActive: processingState.sessionActive,
      planilhaValidada: processingState.planilhaValidada,
      resultFile: !processingState.isProcessing && processingState.results.length > 0 ? 
        `resultado_processamento_${new Date().toISOString().split('T')[0]}.xlsx` : null,
      monitoring: {
        lastUpdateTime: processingState.lastUpdateTime,
        startTime: processingState.startTime,
        totalElapsedTime: processingState.startTime > 0 ? now - processingState.startTime : 0,
        stuckDetectionActive: processingState.isProcessing,
        autoRecoveryStatus: processingState.isStuck ? 'active' : 'standby',
        currentIndex: processingState.currentIndex,
        totalRecords: processingState.data.length
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao obter progresso'
    })
  }
}