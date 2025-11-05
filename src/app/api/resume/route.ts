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

    if (!processingState.isPaused) {
      return NextResponse.json({
        success: false,
        error: 'Processamento não está pausado'
      })
    }

    // Retomar o processamento
    processingState.isPaused = false
    processingState.lastUpdateTime = Date.now()
    
    // Adicionar log
    const log = {
      type: 'info',
      message: 'Processamento retomado',
      timestamp: new Date().toISOString(),
      step: 'Processamento',
      status: 'em andamento'
    }
    processingState.logs.unshift(log)
    
    // Retomar o loop de processamento
    const processNextRecord = async () => {
      try {
        // Verificar se deve continuar
        if (!processingState.isProcessing || processingState.currentIndex >= processingState.data.length) {
          return
        }

        // Verificar se está pausado novamente
        if (processingState.isPaused) {
          return
        }

        const record = processingState.data[processingState.currentIndex]
        if (!record) return

        processingState.stats.current = `${record.CPF} - ${record.Orgao}`

        // Simular processamento da consulta
        const startTime = Date.now()
        
        // Aguardar cadência configurada
        await new Promise(resolve => setTimeout(resolve, processingState.cadence * 1000))
        
        // Simular resultado (em produção seria consulta real)
        const resultado = {
          cpf_consultado: record.CPF,
          matricula_consultada: record.Matricula,
          orgao_consultado: record.Orgao,
          status: Math.random() > 0.1 ? 'Sucesso' : 'Erro',
          erro: Math.random() > 0.1 ? '' : 'Erro simulado',
          margem_disponivel: (Math.random() * 5000 + 1000).toFixed(2),
          tentativas: 1,
          timestamp: new Date().toISOString(),
          tempo_execucao: Date.now() - startTime
        }

        // Atualizar estatísticas
        if (resultado.status === 'Sucesso') {
          processingState.stats.success++
        } else {
          processingState.stats.errors++
        }

        processingState.results.push(resultado)
        processingState.currentIndex++
        processingState.stats.processed++
        processingState.stats.remaining = processingState.stats.total - processingState.stats.processed
        processingState.lastUpdateTime = Date.now()

        // Continuar com próximo registro se não pausado
        if (processingState.isProcessing && !processingState.isPaused && processingState.currentIndex < processingState.data.length) {
          processingState.processingInterval = setTimeout(processNextRecord, processingState.cadence * 1000)
        } else if (processingState.currentIndex >= processingState.data.length) {
          // Finalizar processamento
          processingState.isProcessing = false
          const finalLog = {
            type: 'success',
            message: `Processamento finalizado! ${processingState.stats.processed} registros processados`,
            timestamp: new Date().toISOString(),
            step: 'Processamento',
            status: 'concluído'
          }
          processingState.logs.unshift(finalLog)
        }

      } catch (error) {
        const errorLog = {
          type: 'error',
          message: `Erro no processamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          timestamp: new Date().toISOString(),
          step: 'Processamento',
          status: 'erro'
        }
        processingState.logs.unshift(errorLog)
      }
    }

    // Iniciar processamento após 1 segundo
    setTimeout(processNextRecord, 1000)
    
    return NextResponse.json({
      success: true,
      message: 'Processamento retomado com sucesso'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao retomar processamento'
    })
  }
}