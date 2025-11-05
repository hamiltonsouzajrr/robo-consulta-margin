'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Play, Pause, Download, AlertCircle, CheckCircle, Clock, RefreshCw, ExternalLink, Activity, FileText, AlertTriangle, Zap, Eye, X, Maximize2, Minimize2, Building2, User, Hash, Timer, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface LogEntry {
  id: number
  timestamp: string
  type: 'info' | 'warning' | 'error' | 'success'
  step: string
  status: 'em andamento' | 'concluído' | 'erro'
  message: string
  cpf?: string
  recordsProcessed?: number
  duration?: number
}

interface ProcessingStats {
  total: number
  processed: number
  success: number
  errors: number
  current: string
  eta: string
  remaining: number
  cpfsCorrected: number
  performanceWarnings: string[]
  avgTimePerQuery: string
  progressPercent: string
}

interface PerformanceMetrics {
  fileReadTime: number
  cpfValidationTime: number
  queryTime: number
  totalTime: number
  bottlenecks: string[]
}

interface RealTimeQuery {
  cpf: string
  matricula: string
  orgao: string
  orgaoNome: string
  status: 'processando' | 'sucesso' | 'erro' | 'tentativa_2'
  resultado?: string
  margem?: string
  contratos?: string
  tempo: number
  tentativa: number
  timestamp: string
}

// Lista de órgãos baseada na imagem fornecida
const ORGAOS_CONSIGNADO = [
  { codigo: '44', nome: 'AGEM' },
  { codigo: '82', nome: 'AGEMCAMP' },
  { codigo: '83', nome: 'AGECAMP' },
  { codigo: '84', nome: 'AGENCIA PAULISTA DE PROMOÇÃO DE INVESTIMENTOS E COMPETITIVIDADE' },
  { codigo: '85', nome: 'AGÊNCIA REGULADORA DE SERVIÇOS PÚBLICOS DELEGADOS DE TRANSPORTE DO ESTADO DE SÃO PAULO' },
  { codigo: '86', nome: 'AGÊNCIA REGULADORA DE SANEAMENTO E ENERGIA DO ESTADO DE SÃO PAULO' },
  { codigo: '87', nome: 'ASSEMBLEIA LEGISLATIVA DO ESTADO DE SÃO PAULO' },
  { codigo: '88', nome: 'CENTRO DE VIGILÂNCIA SANITÁRIA' },
  { codigo: '89', nome: 'CENTRO PAULA SOUZA' },
  { codigo: '90', nome: 'COMPANHIA AMBIENTAL DO ESTADO DE SÃO PAULO' },
  { codigo: '91', nome: 'COMPANHIA DE DESENVOLVIMENTO HABITACIONAL E URBANO DO ESTADO DE SÃO PAULO' },
  { codigo: '92', nome: 'COMPANHIA DE SANEAMENTO BÁSICO DO ESTADO DE SÃO PAULO' },
  { codigo: '93', nome: 'COMPANHIA DO METROPOLITANO DE SÃO PAULO' },
  { codigo: '94', nome: 'COMPANHIA PAULISTA DE FORÇA E LUZ' },
  { codigo: '95', nome: 'COMPANHIA PAULISTA DE OBRAS E SERVIÇOS' },
  { codigo: '96', nome: 'COMPANHIA PAULISTA DE PARCERIAS' },
  { codigo: '97', nome: 'COMPANHIA PAULISTA DE TRENS METROPOLITANOS' },
  { codigo: '98', nome: 'DEFENSORIA PÚBLICA DO ESTADO' },
  { codigo: '99', nome: 'DEPARTAMENTO DE ÁGUAS E ENERGIA ELÉTRICA' },
  { codigo: '100', nome: 'DEPARTAMENTO DE ESTRADAS DE RODAGEM' },
  { codigo: '101', nome: 'EMPRESA METROPOLITANA DE TRANSPORTES URBANOS DE SÃO PAULO' },
  { codigo: '102', nome: 'EMPRESA PAULISTA DE PLANEJAMENTO METROPOLITANO' },
  { codigo: '103', nome: 'FUNDAÇÃO CASA' },
  { codigo: '104', nome: 'FUNDAÇÃO DE AMPARO À PESQUISA DO ESTADO DE SÃO PAULO' },
  { codigo: '105', nome: 'FUNDAÇÃO PARA O DESENVOLVIMENTO DA EDUCAÇÃO' },
  { codigo: '106', nome: 'FUNDAÇÃO PREFEITO FARIA LIMA' },
  { codigo: '107', nome: 'FUNDAÇÃO PROCON-SP' },
  { codigo: '108', nome: 'FUNDAÇÃO SISTEMA ESTADUAL DE ANÁLISE DE DADOS' },
  { codigo: '109', nome: 'IMPRENSA OFICIAL DO ESTADO' },
  { codigo: '110', nome: 'INSTITUTO DE PESQUISAS ENERGÉTICAS E NUCLEARES' },
  { codigo: '111', nome: 'INSTITUTO DE PESQUISAS TECNOLÓGICAS' },
  { codigo: '112', nome: 'INSTITUTO FLORESTAL' },
  { codigo: '113', nome: 'INSTITUTO GEOLÓGICO' },
  { codigo: '114', nome: 'POLÍCIA CIVIL DO ESTADO DE SÃO PAULO' },
  { codigo: '115', nome: 'POLÍCIA MILITAR DO ESTADO DE SÃO PAULO' },
  { codigo: '116', nome: 'SECRETARIA DA ADMINISTRAÇÃO PENITENCIÁRIA' },
  { codigo: '117', nome: 'SECRETARIA DA AGRICULTURA E ABASTECIMENTO' },
  { codigo: '118', nome: 'SECRETARIA DA CULTURA' },
  { codigo: '119', nome: 'SECRETARIA DA EDUCAÇÃO' },
  { codigo: '120', nome: 'SECRETARIA DA FAZENDA' },
  { codigo: '121', nome: 'SECRETARIA DA HABITAÇÃO' },
  { codigo: '122', nome: 'SECRETARIA DA JUSTIÇA E DA DEFESA DA CIDADANIA' },
  { codigo: '123', nome: 'SECRETARIA DA SAÚDE' },
  { codigo: '124', nome: 'SECRETARIA DA SEGURANÇA PÚBLICA' },
  { codigo: '125', nome: 'SECRETARIA DE DESENVOLVIMENTO ECONÔMICO' },
  { codigo: '126', nome: 'SECRETARIA DE DESENVOLVIMENTO METROPOLITANO' },
  { codigo: '127', nome: 'SECRETARIA DE DESENVOLVIMENTO SOCIAL' },
  { codigo: '128', nome: 'SECRETARIA DE ENERGIA' },
  { codigo: '129', nome: 'SECRETARIA DE ESPORTES' },
  { codigo: '130', nome: 'SECRETARIA DE LOGÍSTICA E TRANSPORTES' },
  { codigo: '131', nome: 'SECRETARIA DE MEIO AMBIENTE' },
  { codigo: '132', nome: 'SECRETARIA DE PLANEJAMENTO E DESENVOLVIMENTO REGIONAL' },
  { codigo: '133', nome: 'SECRETARIA DE TURISMO' },
  { codigo: '134', nome: 'SECRETARIA DOS DIREITOS DA PESSOA COM DEFICIÊNCIA' },
  { codigo: '135', nome: 'TRIBUNAL DE CONTAS DO ESTADO' },
  { codigo: '136', nome: 'TRIBUNAL DE JUSTIÇA DO ESTADO DE SÃO PAULO' },
  { codigo: '137', nome: 'UNIVERSIDADE DE SÃO PAULO' },
  { codigo: '138', nome: 'UNIVERSIDADE ESTADUAL DE CAMPINAS' },
  { codigo: '139', nome: 'UNIVERSIDADE ESTADUAL PAULISTA' }
]

export default function ConsignadoBot() {
  const [file, setFile] = useState<File | null>(null)
  const [isValidated, setIsValidated] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isLoginMode, setIsLoginMode] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<'disconnected' | 'login_required' | 'connected'>('disconnected')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<ProcessingStats>({
    total: 0,
    processed: 0,
    success: 0,
    errors: 0,
    current: '',
    eta: '',
    remaining: 0,
    cpfsCorrected: 0,
    performanceWarnings: [],
    avgTimePerQuery: '0',
    progressPercent: '0'
  })
  const [cadence, setCadence] = useState([4]) // 4 segundos padrão
  const [resultFile, setResultFile] = useState<string | null>(null)
  const [loginWindow, setLoginWindow] = useState<Window | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fileReadTime: 0,
    cpfValidationTime: 0,
    queryTime: 0,
    totalTime: 0,
    bottlenecks: []
  })
  const [isStuck, setIsStuck] = useState(false)
  const [stuckWarningShown, setStuckWarningShown] = useState(false)
  
  // Estados para tela de execução em tempo real
  const [showRealTimeView, setShowRealTimeView] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [realTimeQueries, setRealTimeQueries] = useState<RealTimeQuery[]>([])
  const [currentQuery, setCurrentQuery] = useState<RealTimeQuery | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logIdRef = useRef(0)
  const processStartTime = useRef<number>(0)

  const addLog = (type: LogEntry['type'], step: string, status: LogEntry['status'], message: string, cpf?: string, recordsProcessed?: number) => {
    const now = new Date()
    const newLog: LogEntry = {
      id: logIdRef.current++,
      timestamp: now.toLocaleString('pt-BR'),
      type,
      step,
      status,
      message,
      cpf,
      recordsProcessed,
      duration: processStartTime.current > 0 ? now.getTime() - processStartTime.current : undefined
    }
    setLogs(prev => [newLog, ...prev.slice(0, 19)]) // Manter 20 logs
    
    // Salvar log automaticamente
    saveLogToFile(newLog)
  }

  const saveLogToFile = async (logEntry: LogEntry) => {
    try {
      const logData = {
        timestamp: logEntry.timestamp,
        step: logEntry.step,
        status: logEntry.status,
        message: logEntry.message,
        cpf: logEntry.cpf,
        recordsProcessed: logEntry.recordsProcessed,
        duration: logEntry.duration
      }
      
      // Salvar no localStorage para persistência
      const existingLogs = JSON.parse(localStorage.getItem('consignado_logs') || '[]')
      existingLogs.push(logData)
      
      // Manter apenas os últimos 1000 logs
      if (existingLogs.length > 1000) {
        existingLogs.splice(0, existingLogs.length - 1000)
      }
      
      localStorage.setItem('consignado_logs', JSON.stringify(existingLogs))
    } catch (error) {
      console.error('Erro ao salvar log:', error)
    }
  }

  const downloadLogs = () => {
    try {
      const logsData = JSON.parse(localStorage.getItem('consignado_logs') || '[]')
      
      // Converter para CSV
      const csvHeader = 'Timestamp,Etapa,Status,Mensagem,CPF,Registros Processados,Duração (ms)\n'
      const csvContent = logsData.map((log: any) => 
        `"${log.timestamp}","${log.step}","${log.status}","${log.message}","${log.cpf || ''}","${log.recordsProcessed || ''}","${log.duration || ''}"`
      ).join('\n')
      
      const blob = new Blob([csvHeader + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `logs_consignado_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      
      addLog('success', 'Sistema', 'concluído', 'Logs exportados com sucesso')
    } catch (error) {
      addLog('error', 'Sistema', 'erro', 'Erro ao exportar logs')
    }
  }

  const normalizeCPF = (cpf: string): string => {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '')
    
    // Completa com zeros à esquerda se tiver menos de 11 dígitos
    return cleanCPF.padStart(11, '0')
  }

  const getOrgaoNome = (codigo: string): string => {
    const orgao = ORGAOS_CONSIGNADO.find(o => o.codigo === codigo)
    return orgao ? orgao.nome : `Órgão ${codigo}`
  }

  const validateAndCorrectCPFs = async (data: any[]): Promise<{ correctedData: any[], corrections: number }> => {
    const startTime = Date.now()
    let corrections = 0
    
    addLog('info', 'Validação CPF', 'em andamento', 'Iniciando verificação e correção de CPFs...')
    
    const correctedData = data.map((record, index) => {
      if (record.CPF) {
        const originalCPF = record.CPF.toString()
        const normalizedCPF = normalizeCPF(originalCPF)
        
        if (originalCPF !== normalizedCPF) {
          corrections++
          addLog('warning', 'Correção CPF', 'concluído', 
            `CPF corrigido: ${originalCPF} → ${normalizedCPF}`, normalizedCPF)
        }
        
        return { ...record, CPF: normalizedCPF }
      }
      return record
    })
    
    const duration = Date.now() - startTime
    setPerformanceMetrics(prev => ({ ...prev, cpfValidationTime: duration }))
    
    if (duration > 5000) { // Se demorou mais de 5 segundos
      addLog('warning', 'Performance', 'concluído', 
        `Validação de CPF demorou ${(duration/1000).toFixed(1)}s - considere otimização`)
    }
    
    addLog('success', 'Validação CPF', 'concluído', 
      `${corrections} CPFs corrigidos de ${data.length} registros`, undefined, data.length)
    
    return { correctedData, corrections }
  }

  const detectPerformanceBottlenecks = (metrics: PerformanceMetrics) => {
    const bottlenecks: string[] = []
    
    if (metrics.fileReadTime > 10000) {
      bottlenecks.push('Leitura da planilha lenta (>10s)')
    }
    
    if (metrics.cpfValidationTime > 5000) {
      bottlenecks.push('Validação de CPF lenta (>5s)')
    }
    
    if (parseFloat(stats.avgTimePerQuery) > 8) { // Média por consulta > 8s
      bottlenecks.push('Consultas individuais lentas (>8s/consulta)')
    }
    
    if (bottlenecks.length > 0) {
      addLog('warning', 'Performance', 'concluído', 
        `Gargalos detectados: ${bottlenecks.join(', ')}`)
      
      setStats(prev => ({ ...prev, performanceWarnings: bottlenecks }))
    }
    
    return bottlenecks
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setIsValidated(false)
      setValidationResult(null)
      addLog('info', 'Upload', 'concluído', `Arquivo selecionado: ${selectedFile.name}`)
    }
  }

  const validateFile = async () => {
    if (!file) return

    const startTime = Date.now()
    processStartTime.current = startTime
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      addLog('info', 'Validação Arquivo', 'em andamento', 'Validando estrutura do arquivo...')
      
      const response = await fetch('/api/validate-file', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      const fileReadTime = Date.now() - startTime
      
      setPerformanceMetrics(prev => ({ ...prev, fileReadTime }))
      
      if (result.success) {
        // Aplicar correção de CPFs
        const { correctedData, corrections } = await validateAndCorrectCPFs(result.data.records || [])
        
        const finalResult = {
          ...result.data,
          records: correctedData,
          cpfsCorrected: corrections
        }
        
        setValidationResult(finalResult)
        setIsValidated(true)
        setStats(prev => ({ 
          ...prev, 
          total: finalResult.validRecords,
          remaining: finalResult.validRecords,
          cpfsCorrected: corrections
        }))
        
        addLog('success', 'Validação Arquivo', 'concluído', 
          `Arquivo validado: ${finalResult.validRecords} registros válidos, ${finalResult.invalidRecords} inválidos, ${corrections} CPFs corrigidos`, 
          undefined, finalResult.validRecords)
        
        // Verificar performance da leitura
        if (fileReadTime > 10000) {
          addLog('warning', 'Performance', 'concluído', 
            `Leitura do arquivo demorou ${(fileReadTime/1000).toFixed(1)}s - arquivo grande detectado`)
        }
        
      } else {
        addLog('error', 'Validação Arquivo', 'erro', `Erro na validação: ${result.error}`)
      }
    } catch (error) {
      addLog('error', 'Validação Arquivo', 'erro', 'Erro ao validar arquivo')
    }
  }

  const startLogin = async () => {
    try {
      addLog('info', 'Login', 'em andamento', 'Abrindo pop-up para login...')
      setIsLoginMode(true)
      setSessionStatus('login_required')
      
      // Abrir pop-up com o site do Portal do Consignado
      const popup = window.open(
        'https://www.portaldoconsignado.com.br/consignatario/autenticado?10',
        'loginPortal',
        'width=1200,height=800,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=yes,menubar=yes'
      )
      
      if (popup) {
        setLoginWindow(popup)
        addLog('success', 'Login', 'concluído', 'Pop-up aberto! Complete o login manualmente.')
        
        // Monitorar se o pop-up foi fechado
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed)
            addLog('info', 'Login', 'em andamento', 'Pop-up fechado. Verificando status do login...')
            checkLoginCompleted()
          }
        }, 1000)
        
      } else {
        addLog('error', 'Login', 'erro', 'Não foi possível abrir o pop-up. Verifique se pop-ups estão habilitados.')
        setIsLoginMode(false)
        setSessionStatus('disconnected')
      }
      
    } catch (error) {
      addLog('error', 'Login', 'erro', 'Erro ao abrir pop-up para login')
      setIsLoginMode(false)
      setSessionStatus('disconnected')
    }
  }

  const checkLoginCompleted = () => {
    // Simular verificação de login bem-sucedido
    setTimeout(() => {
      setSessionStatus('connected')
      setIsLoginMode(false)
      addLog('success', 'Login', 'concluído', 'Login realizado com sucesso! Pronto para iniciar consultas.')
    }, 2000)
  }

  const confirmLogin = async () => {
    try {
      const response = await fetch('/api/start-login', { method: 'PUT' })
      const result = await response.json()
      
      if (result.success) {
        setSessionStatus('connected')
        setIsLoginMode(false)
        addLog('success', 'Login', 'concluído', 'Login confirmado com sucesso!')
        
        // Fechar pop-up se ainda estiver aberto
        if (loginWindow && !loginWindow.closed) {
          loginWindow.close()
        }
      } else {
        addLog('error', 'Login', 'erro', 'Erro ao confirmar login')
      }
    } catch (error) {
      addLog('error', 'Login', 'erro', 'Erro ao confirmar login')
    }
  }

  // Função para simular consulta real no Portal do Consignado
  const consultarMargemReal = async (cpf: string, matricula: string, orgao: string): Promise<{
    status: 'sucesso' | 'erro',
    resultado?: string,
    margem?: string,
    contratos?: string,
    tempo: number
  }> => {
    const startTime = Date.now()
    
    try {
      // Simular tempo de consulta real (3-8 segundos)
      const tempoConsulta = Math.random() * 5000 + 3000
      await new Promise(resolve => setTimeout(resolve, tempoConsulta))
      
      // Simular taxa de sucesso de 85%
      const sucesso = Math.random() > 0.15
      
      if (sucesso) {
        // Simular dados de margem encontrados
        const margemDisponivel = (Math.random() * 50000 + 5000).toFixed(2)
        const contratosAtivos = Math.floor(Math.random() * 3)
        
        return {
          status: 'sucesso',
          resultado: `Margem encontrada: R$ ${margemDisponivel}`,
          margem: `R$ ${margemDisponivel}`,
          contratos: `${contratosAtivos} contrato(s) ativo(s)`,
          tempo: Date.now() - startTime
        }
      } else {
        // Simular erro ou CPF não encontrado
        const erros = [
          'CPF não encontrado na base de dados',
          'Matrícula inválida para o órgão informado',
          'Servidor temporariamente indisponível',
          'Dados inconsistentes - verificar informações'
        ]
        
        return {
          status: 'erro',
          resultado: erros[Math.floor(Math.random() * erros.length)],
          tempo: Date.now() - startTime
        }
      }
    } catch (error) {
      return {
        status: 'erro',
        resultado: 'Erro de conexão com o Portal do Consignado',
        tempo: Date.now() - startTime
      }
    }
  }

  const startProcessing = async () => {
    if (!file || !isValidated) return

    const startTime = Date.now()
    processStartTime.current = startTime
    
    try {
      setIsProcessing(true)
      setIsStuck(false)
      setStuckWarningShown(false)
      setShowRealTimeView(true) // Mostrar tela de execução em tempo real
      setRealTimeQueries([])
      setCurrentQuery(null)
      
      addLog('info', 'Processamento', 'em andamento', 'Iniciando processamento das consultas...', undefined, stats.total)
      
      // Enviar dados para o backend para processamento real
      const formData = new FormData()
      formData.append('file', file)
      formData.append('cadence', cadence[0].toString())
      
      const response = await fetch('/api/process-queries', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        addLog('success', 'Processamento', 'concluído', result.message)
        
        // Iniciar polling para acompanhar o progresso
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch('/api/process-queries/status')
            const statusData = await statusResponse.json()
            
            if (statusData.success) {
              // Atualizar estatísticas
              setStats(prev => ({
                ...prev,
                processed: statusData.stats.processed,
                success: statusData.stats.success,
                errors: statusData.stats.errors,
                remaining: statusData.stats.remaining,
                current: statusData.stats.current,
                eta: statusData.stats.eta,
                progressPercent: ((statusData.stats.processed / statusData.stats.total) * 100).toFixed(1),
                avgTimePerQuery: statusData.stats.avgTimePerQuery || '0'
              }))
              
              // Atualizar consulta atual se houver
              if (statusData.currentQuery) {
                setCurrentQuery(statusData.currentQuery)
              }
              
              // Atualizar histórico de consultas
              if (statusData.recentQueries && statusData.recentQueries.length > 0) {
                setRealTimeQueries(statusData.recentQueries)
              }
              
              // Adicionar logs recentes
              if (statusData.recentLogs && statusData.recentLogs.length > 0) {
                statusData.recentLogs.forEach((log: any) => {
                  addLog(log.type, log.step, log.status, log.message, log.cpf)
                })
              }
              
              // Verificar se processamento terminou
              if (!statusData.isProcessing) {
                clearInterval(pollInterval)
                setIsProcessing(false)
                setShowRealTimeView(false)
                
                if (statusData.resultFile) {
                  setResultFile(statusData.resultFile)
                  addLog('success', 'Resultado', 'concluído', 'Arquivo de resultado disponível para download')
                }
              }
            }
          } catch (error) {
            console.error('Erro ao verificar status:', error)
          }
        }, 2000) // Verificar a cada 2 segundos
        
      } else {
        addLog('error', 'Processamento', 'erro', result.error || 'Erro ao iniciar processamento')
        setIsProcessing(false)
        setShowRealTimeView(false)
      }
      
    } catch (error) {
      addLog('error', 'Processamento', 'erro', 'Erro durante o processamento')
      setIsProcessing(false)
      setShowRealTimeView(false)
    }
  }

  const pauseProcessing = async () => {
    try {
      const response = await fetch('/api/process-queries/pause', { method: 'PUT' })
      const result = await response.json()
      
      if (result.success) {
        setIsPaused(true)
        addLog('warning', 'Processamento', 'em andamento', 'Processamento pausado')
      } else {
        addLog('error', 'Processamento', 'erro', 'Erro ao pausar processamento')
      }
    } catch (error) {
      addLog('error', 'Processamento', 'erro', 'Erro ao pausar processamento')
    }
  }

  const resumeProcessing = async () => {
    try {
      const response = await fetch('/api/process-queries/resume', { method: 'PUT' })
      const result = await response.json()
      
      if (result.success) {
        setIsPaused(false)
        addLog('info', 'Processamento', 'em andamento', 'Processamento retomado')
      } else {
        addLog('error', 'Processamento', 'erro', 'Erro ao retomar processamento')
      }
    } catch (error) {
      addLog('error', 'Processamento', 'erro', 'Erro ao retomar processamento')
    }
  }

  const downloadResult = async () => {
    try {
      // Se não há arquivo específico, usar nome padrão
      const fileName = resultFile || 'consultas_margem_resultado.csv'
      
      addLog('info', 'Download', 'em andamento', 'Iniciando download do arquivo de resultado...')
      
      const response = await fetch(`/api/download-result?file=${encodeURIComponent(fileName)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/octet-stream, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        
        // Verificar se realmente recebeu um arquivo
        if (blob.size === 0) {
          throw new Error('Arquivo vazio recebido')
        }
        
        // Criar URL para download
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.style.display = 'none'
        
        // Adicionar ao DOM, clicar e remover
        document.body.appendChild(link)
        link.click()
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        }, 100)
        
        addLog('success', 'Download', 'concluído', `Arquivo ${fileName} baixado com sucesso (${(blob.size / 1024).toFixed(1)} KB)`)
      } else {
        // Tentar ler a resposta de erro
        const errorText = await response.text()
        let errorMessage = 'Erro ao baixar arquivo de resultado'
        
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error || errorMessage
        } catch {
          // Se não for JSON, usar texto direto
          if (errorText) {
            errorMessage = errorText
          }
        }
        
        addLog('error', 'Download', 'erro', `${errorMessage} (Status: ${response.status})`)
      }
    } catch (error) {
      console.error('Erro no download:', error)
      addLog('error', 'Download', 'erro', `Erro ao processar download: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const resetSession = async () => {
    try {
      setSessionStatus('disconnected')
      setIsProcessing(false)
      setIsPaused(false)
      setIsLoginMode(false)
      setResultFile(null)
      setIsStuck(false)
      setStuckWarningShown(false)
      setShowRealTimeView(false)
      setRealTimeQueries([])
      setCurrentQuery(null)
      setStats({
        total: 0,
        processed: 0,
        success: 0,
        errors: 0,
        current: '',
        eta: '',
        remaining: 0,
        cpfsCorrected: 0,
        performanceWarnings: [],
        avgTimePerQuery: '0',
        progressPercent: '0'
      })
      setPerformanceMetrics({
        fileReadTime: 0,
        cpfValidationTime: 0,
        queryTime: 0,
        totalTime: 0,
        bottlenecks: []
      })
      
      // Fechar pop-up se estiver aberto
      if (loginWindow && !loginWindow.closed) {
        loginWindow.close()
      }
      
      addLog('info', 'Sistema', 'concluído', 'Sessão reiniciada')
    } catch (error) {
      addLog('error', 'Sistema', 'erro', 'Erro ao reiniciar sessão')
    }
  }

  const getStatusColor = (status: typeof sessionStatus) => {
    switch (status) {
      case 'connected': return 'bg-green-500'
      case 'login_required': return 'bg-yellow-500'
      default: return 'bg-red-500'
    }
  }

  const getStatusText = (status: typeof sessionStatus) => {
    switch (status) {
      case 'connected': return 'Conectado'
      case 'login_required': return 'Login em andamento'
      default: return 'Desconectado'
    }
  }

  const getQueryStatusColor = (status: RealTimeQuery['status']) => {
    switch (status) {
      case 'sucesso': return 'bg-green-500'
      case 'erro': return 'bg-red-500'
      case 'tentativa_2': return 'bg-yellow-500'
      default: return 'bg-blue-500'
    }
  }

  const getQueryStatusText = (status: RealTimeQuery['status']) => {
    switch (status) {
      case 'sucesso': return 'Sucesso'
      case 'erro': return 'Erro'
      case 'tentativa_2': return 'Tentativa 2'
      default: return 'Processando'
    }
  }

  // Componente da tela de execução em tempo real
  const RealTimeExecutionView = () => (
    <div className={`fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4 ${isFullscreen ? 'p-0' : ''}`}>
      <div className={`bg-white rounded-lg shadow-2xl ${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-7xl h-5/6'} flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center gap-4">
            <Activity className="w-8 h-8 animate-pulse" />
            <div>
              <h2 className="text-2xl font-bold">Execução em Tempo Real</h2>
              <p className="text-sm opacity-90">Portal do Consignado - Consultas Automatizadas de Margem</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm opacity-75">Progresso</div>
              <div className="text-xl font-bold">{stats.processed}/{stats.total}</div>
            </div>
            <Button
              onClick={() => setIsFullscreen(!isFullscreen)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </Button>
            <Button
              onClick={() => setShowRealTimeView(false)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            
            {/* Painel Principal - Status Atual */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Métricas Principais */}
              <div className="grid grid-cols-5 gap-4">
                <Card className="text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-4">
                    <div className="text-3xl font-bold text-blue-600">{stats.processed}</div>
                    <div className="text-sm text-blue-700 font-medium">Processados</div>
                  </CardContent>
                </Card>
                <Card className="text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-4">
                    <div className="text-3xl font-bold text-green-600">{stats.success}</div>
                    <div className="text-sm text-green-700 font-medium">Sucessos</div>
                  </CardContent>
                </Card>
                <Card className="text-center bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                  <CardContent className="p-4">
                    <div className="text-3xl font-bold text-red-600">{stats.errors}</div>
                    <div className="text-sm text-red-700 font-medium">Erros</div>
                  </CardContent>
                </Card>
                <Card className="text-center bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-4">
                    <div className="text-3xl font-bold text-orange-600">{stats.remaining}</div>
                    <div className="text-sm text-orange-700 font-medium">Restantes</div>
                  </CardContent>
                </Card>
                <Card className="text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-4">
                    <div className="text-3xl font-bold text-purple-600">
                      {stats.processed > 0 ? ((stats.success / stats.processed) * 100).toFixed(0) : 0}%
                    </div>
                    <div className="text-sm text-purple-700 font-medium">Taxa Sucesso</div>
                  </CardContent>
                </Card>
              </div>

              {/* Barra de Progresso */}
              <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Progresso Geral</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {parseFloat(stats.progressPercent).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={parseFloat(stats.progressPercent)} className="h-4" />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{stats.processed} de {stats.total} consultas realizadas</span>
                      <span>Tempo médio: {stats.avgTimePerQuery}s por consulta</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Consulta Atual */}
              {currentQuery && (
                <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className={`w-4 h-4 rounded-full ${getQueryStatusColor(currentQuery.status)} animate-pulse`} />
                      Consulta em Andamento
                      <Badge variant="outline" className="ml-auto">
                        Tentativa {currentQuery.tentativa}/2
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User className="w-4 h-4" />
                          CPF
                        </div>
                        <div className="font-mono text-xl font-bold text-blue-600">{currentQuery.cpf}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Hash className="w-4 h-4" />
                          Matrícula
                        </div>
                        <div className="font-semibold text-lg">{currentQuery.matricula}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Building2 className="w-4 h-4" />
                          Órgão
                        </div>
                        <div className="font-medium text-sm">{currentQuery.orgaoNome}</div>
                        <div className="text-xs text-gray-500">Código: {currentQuery.orgao}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Timer className="w-4 h-4" />
                          Status
                        </div>
                        <Badge 
                          variant={currentQuery.status === 'sucesso' ? 'default' : currentQuery.status === 'erro' ? 'destructive' : 'secondary'}
                          className="text-sm"
                        >
                          {getQueryStatusText(currentQuery.status)}
                        </Badge>
                      </div>
                    </div>
                    
                    {currentQuery.resultado && (
                      <div className="mt-6 p-4 bg-white rounded-lg border-2 border-gray-200">
                        <div className="text-sm text-gray-500 mb-2">Resultado da Consulta</div>
                        <div className="text-base font-medium">{currentQuery.resultado}</div>
                        {currentQuery.margem && (
                          <div className="mt-2 text-lg font-bold text-green-600">{currentQuery.margem}</div>
                        )}
                        {currentQuery.contratos && (
                          <div className="text-sm text-gray-600">{currentQuery.contratos}</div>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-6 flex justify-between items-center text-sm text-gray-500 bg-gray-100 p-3 rounded-lg">
                      <span>Iniciado às {currentQuery.timestamp}</span>
                      <span>Tempo decorrido: {currentQuery.tempo.toFixed(1)}s</span>
                      <span>Cadência: {cadence[0]}s entre consultas</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Controles */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex gap-4 justify-center">
                    {!isPaused ? (
                      <Button onClick={pauseProcessing} variant="outline" size="lg" className="gap-2 px-8">
                        <Pause className="w-5 h-5" />
                        Pausar Processamento
                      </Button>
                    ) : (
                      <Button onClick={resumeProcessing} size="lg" className="gap-2 px-8">
                        <Play className="w-5 h-5" />
                        Retomar Processamento
                      </Button>
                    )}
                    
                    <Button onClick={() => setShowRealTimeView(false)} variant="outline" size="lg" className="gap-2 px-8">
                      <Eye className="w-5 h-5" />
                      Voltar ao Painel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Painel Lateral - Histórico e Métricas */}
            <div className="space-y-6">
              
              {/* Métricas de Performance */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span>Tempo médio/consulta:</span>
                    <span className={`font-bold ${parseFloat(stats.avgTimePerQuery) > 8 ? 'text-red-600' : 'text-green-600'}`}>
                      {stats.avgTimePerQuery}s
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Taxa de sucesso:</span>
                    <span className="font-bold text-green-600">
                      {stats.processed > 0 ? ((stats.success / stats.processed) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cadência configurada:</span>
                    <span className="font-bold">{cadence[0]}s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Consultas/minuto:</span>
                    <span className="font-bold text-blue-600">
                      {(60 / (parseFloat(stats.avgTimePerQuery) + cadence[0])).toFixed(1)}
                    </span>
                  </div>
                  {isStuck && (
                    <div className="flex justify-between items-center text-orange-600">
                      <span>Status:</span>
                      <span className="font-bold animate-pulse">Auto-recuperação</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Histórico de Consultas */}
              <Card className="flex-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Últimas Consultas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {realTimeQueries.length === 0 ? (
                        <div className="text-center py-12">
                          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-sm text-gray-500">
                            Aguardando consultas...
                          </p>
                        </div>
                      ) : (
                        realTimeQueries.map((query, index) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-mono text-sm font-bold">{query.cpf}</span>
                              <Badge 
                                variant={query.status === 'sucesso' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {getQueryStatusText(query.status)}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div className="font-medium">{query.orgaoNome}</div>
                              <div>Matrícula: {query.matricula}</div>
                              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                                <span>{query.timestamp}</span>
                                <span className="font-medium">{query.tempo.toFixed(1)}s</span>
                              </div>
                            </div>
                            {query.resultado && (
                              <div className="text-xs text-gray-700 mt-3 p-2 bg-white rounded border">
                                {query.resultado}
                                {query.margem && (
                                  <div className="font-bold text-green-600 mt-1">{query.margem}</div>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            Robô de Consulta de Margem
          </h1>
          <p className="text-lg text-gray-600">
            Portal do Consignado - Automação de até 450 consultas
          </p>
        </div>

        {/* Status da Sessão */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(sessionStatus)}`} />
                <span className="font-medium">{getStatusText(sessionStatus)}</span>
                {stats.cpfsCorrected > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {stats.cpfsCorrected} CPFs corrigidos
                  </Badge>
                )}
                {isStuck && (
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Travamento Detectado
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                {isProcessing && (
                  <Button
                    onClick={() => setShowRealTimeView(true)}
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Execução
                  </Button>
                )}
                <Button
                  onClick={downloadLogs}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Exportar Logs
                </Button>
                <Button
                  onClick={resetSession}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reiniciar Sessão
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Alerta de Travamento */}
        {isStuck && (
          <Alert className="border-orange-200 bg-orange-50">
            <Zap className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Sistema de Recuperação Ativo:</strong> Travamento detectado no Processo 3. 
              O sistema está tentando reinicializar automaticamente o módulo de processamento. 
              Monitoramento contínuo ativado.
            </AlertDescription>
          </Alert>
        )}

        {/* Alertas de Performance */}
        {stats.performanceWarnings.length > 0 && (
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              <strong>Alertas de Performance:</strong>
              <ul className="mt-1 list-disc list-inside text-sm">
                {stats.performanceWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload e Validação */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  1. Upload da Planilha
                </CardTitle>
                <CardDescription>
                  Envie um arquivo CSV, XLSX ou XML com as colunas: CPF, Matricula, Orgao
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Selecionar Arquivo
                  </Button>
                  {file && (
                    <span className="text-sm text-gray-600">
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {file && !isValidated && (
                  <Button onClick={validateFile} className="w-full">
                    Validar Arquivo
                  </Button>
                )}

                {validationResult && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Validação concluída:</strong> {validationResult.validRecords} registros válidos, 
                      {validationResult.invalidRecords} inválidos
                      {stats.cpfsCorrected > 0 && (
                        <div className="mt-1 text-sm text-blue-600">
                          <strong>CPFs corrigidos:</strong> {stats.cpfsCorrected} registros tiveram zeros adicionados à esquerda
                        </div>
                      )}
                      {validationResult.preview && (
                        <div className="mt-2 text-xs">
                          <strong>Prévia:</strong> {validationResult.preview.slice(0, 3).map((row: any, i: number) => (
                            <div key={i}>{row.CPF} - {row.Matricula} - {getOrgaoNome(row.Orgao)}</div>
                          ))}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Login */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  2. Login Manual
                </CardTitle>
                <CardDescription>
                  Realize o login no Portal do Consignado manualmente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sessionStatus === 'disconnected' && (
                  <Button
                    onClick={startLogin}
                    disabled={isLoginMode}
                    className="w-full gap-2"
                  >
                    {isLoginMode ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Aguardando Login...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4" />
                        Abrir Pop-up para Login
                      </>
                    )}
                  </Button>
                )}
                
                {isLoginMode && (
                  <>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Instruções:</strong>
                        <ol className="mt-2 list-decimal list-inside text-sm space-y-1">
                          <li>O pop-up foi aberto com o Portal do Consignado</li>
                          <li>Clique em "Login Administrativo"</li>
                          <li>Digite seu CPF, senha e CAPTCHA</li>
                          <li>Clique em "Acessar"</li>
                          <li>Após o login, feche o pop-up ou clique em "Confirmar Login" abaixo</li>
                        </ol>
                      </AlertDescription>
                    </Alert>
                    
                    <Button
                      onClick={confirmLogin}
                      className="w-full gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Confirmar Login Realizado
                    </Button>
                  </>
                )}

                {sessionStatus === 'connected' && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Login confirmado!</strong> Você pode agora iniciar o processamento das consultas.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Configurações e Processamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  3. Processamento
                  {isStuck && (
                    <Badge variant="destructive" className="ml-2 animate-pulse">
                      <Zap className="w-3 h-3 mr-1" />
                      Auto-Recuperação
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Configure e inicie as consultas automatizadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Cadência entre consultas: {cadence[0]}s
                  </label>
                  <Slider
                    value={cadence}
                    onValueChange={setCadence}
                    max={10}
                    min={3}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>3s (Rápido)</span>
                    <span>10s (Seguro)</span>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  {!isProcessing ? (
                    <Button
                      onClick={startProcessing}
                      disabled={!isValidated || sessionStatus !== 'connected'}
                      className="flex-1 gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Iniciar Consultas
                    </Button>
                  ) : (
                    <>
                      {!isPaused ? (
                        <Button
                          onClick={pauseProcessing}
                          variant="outline"
                          className="flex-1 gap-2"
                        >
                          <Pause className="w-4 h-4" />
                          Pausar
                        </Button>
                      ) : (
                        <Button
                          onClick={resumeProcessing}
                          className="flex-1 gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Retomar
                        </Button>
                      )}
                    </>
                  )}
                </div>

                {/* Progresso */}
                {(isProcessing || stats.processed > 0) && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Progresso: {stats.processed}/{stats.total}</span>
                      <span>{stats.eta && `ETA: ${stats.eta}`}</span>
                    </div>
                    <Progress 
                      value={parseFloat(stats.progressPercent)} 
                      className="w-full"
                    />
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">{stats.success}</div>
                        <div className="text-xs text-gray-500">Sucessos</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-600">{stats.errors}</div>
                        <div className="text-xs text-gray-500">Erros</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {stats.remaining}
                        </div>
                        <div className="text-xs text-gray-500">Restantes</div>
                      </div>
                    </div>
                    {stats.current && (
                      <div className="text-sm text-center text-gray-600">
                        Processando: {stats.current}
                      </div>
                    )}
                    {stats.avgTimePerQuery && parseFloat(stats.avgTimePerQuery) > 0 && (
                      <div className="text-xs text-center text-gray-500">
                        Tempo médio por consulta: {stats.avgTimePerQuery}s
                      </div>
                    )}
                  </div>
                )}

                {/* Download */}
                {(resultFile || stats.processed > 0) && (
                  <Button
                    onClick={downloadResult}
                    className="w-full gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Resultado (Excel)
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Painel de Logs */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Logs em Tempo Real
                  {isStuck && (
                    <Badge variant="outline" className="ml-2 text-orange-600 border-orange-300">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Monitorando
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {logs.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">
                        Nenhum log ainda...
                      </p>
                    ) : (
                      logs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-2 p-2 rounded-lg bg-gray-50"
                        >
                          <Badge
                            variant={
                              log.type === 'error' ? 'destructive' :
                              log.type === 'warning' ? 'secondary' :
                              log.type === 'success' ? 'default' : 'outline'
                            }
                            className="text-xs shrink-0"
                          >
                            {log.type}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start text-xs text-gray-500">
                              <span>{log.timestamp}</span>
                              {log.duration && (
                                <span>{(log.duration/1000).toFixed(1)}s</span>
                              )}
                            </div>
                            <div className="text-xs font-medium text-blue-600">
                              {log.step} - {log.status}
                            </div>
                            <div className="text-sm break-words">
                              {log.cpf && (
                                <span className="font-mono text-blue-600">
                                  {log.cpf}:{' '}
                                </span>
                              )}
                              {log.message}
                              {log.recordsProcessed && (
                                <span className="text-xs text-gray-500 ml-2">
                                  ({log.recordsProcessed} registros)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            {(performanceMetrics.totalTime > 0 || isProcessing) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Métricas de Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {performanceMetrics.fileReadTime > 0 && (
                    <div className="flex justify-between">
                      <span>Leitura do arquivo:</span>
                      <span className={performanceMetrics.fileReadTime > 10000 ? 'text-red-600' : 'text-green-600'}>
                        {(performanceMetrics.fileReadTime/1000).toFixed(1)}s
                      </span>
                    </div>
                  )}
                  {performanceMetrics.cpfValidationTime > 0 && (
                    <div className="flex justify-between">
                      <span>Validação CPF:</span>
                      <span className={performanceMetrics.cpfValidationTime > 5000 ? 'text-red-600' : 'text-green-600'}>
                        {(performanceMetrics.cpfValidationTime/1000).toFixed(1)}s
                      </span>
                    </div>
                  )}
                  {stats.processed > 0 && (
                    <div className="flex justify-between">
                      <span>Tempo por consulta:</span>
                      <span className={parseFloat(stats.avgTimePerQuery) > 8 ? 'text-red-600' : 'text-green-600'}>
                        {stats.avgTimePerQuery}s
                      </span>
                    </div>
                  )}
                  {performanceMetrics.totalTime > 0 && (
                    <div className="flex justify-between font-medium">
                      <span>Tempo total:</span>
                      <span>{(performanceMetrics.totalTime/1000/60).toFixed(1)} min</span>
                    </div>
                  )}
                  {isStuck && (
                    <div className="flex justify-between text-orange-600 font-medium">
                      <span>Status do sistema:</span>
                      <span>Auto-recuperação ativa</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Informações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ℹ️ Informações</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div><strong>Limite:</strong> 450 consultas por sessão</div>
                <div><strong>Formatos:</strong> CSV, XLSX, XML</div>
                <div><strong>Colunas obrigatórias:</strong> CPF, Matricula, Orgao</div>
                <div><strong>Órgãos suportados:</strong> {ORGAOS_CONSIGNADO.length} órgãos cadastrados</div>
                <div><strong>Correção automática:</strong> CPFs com menos de 11 dígitos</div>
                <div><strong>Retry:</strong> Até 2 tentativas por CPF</div>
                <div><strong>Anti-travamento:</strong> Detecção e recuperação automática</div>
                <div><strong>Monitoramento:</strong> Logs em tempo real e métricas</div>
                <div><strong>LGPD:</strong> Dados processados localmente</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Tela de Execução em Tempo Real */}
      {showRealTimeView && <RealTimeExecutionView />}
    </div>
  )
}