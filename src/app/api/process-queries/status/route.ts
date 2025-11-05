import { NextResponse } from 'next/server'

// Importar o estado do processamento
import { processingState } from '../route'

export async function GET() {
  try {
    // Retornar status atual do processamento
    return NextResponse.json({
      success: true,
      isProcessing: processingState.isProcessing,
      isPaused: processingState.isPaused,
      stats: processingState.stats,
      currentQuery: processingState.currentIndex < processingState.data.length ? {
        cpf: processingState.data[processingState.currentIndex]?.CPF,
        matricula: processingState.data[processingState.currentIndex]?.Matricula,
        orgao: processingState.data[processingState.currentIndex]?.Orgao,
        orgaoNome: `Órgão ${processingState.data[processingState.currentIndex]?.Orgao}`,
        status: 'processando',
        tempo: 0,
        tentativa: 1,
        timestamp: new Date().toLocaleTimeString('pt-BR')
      } : null,
      recentQueries: processingState.results.slice(-10).map(result => ({
        cpf: result.cpf_consultado,
        matricula: result.matricula_consultada,
        orgao: result.orgao_consultado,
        orgaoNome: `Órgão ${result.orgao_consultado}`,
        status: result.status === 'Sucesso' ? 'sucesso' : 'erro',
        resultado: result.status === 'Sucesso' ? `Margem: R$ ${result.margem_disponivel}` : result.erro,
        margem: result.margem_disponivel ? `R$ ${result.margem_disponivel}` : undefined,
        contratos: result.contratos_ativos ? `${result.contratos_ativos} contrato(s)` : undefined,
        tempo: result.tempo_execucao / 1000,
        tentativa: result.tentativas,
        timestamp: new Date(result.timestamp).toLocaleTimeString('pt-BR')
      })),
      recentLogs: processingState.logs.slice(0, 5),
      resultFile: processingState.isProcessing ? null : 'resultado_consultas.xlsx'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao obter status do processamento'
    })
  }
}