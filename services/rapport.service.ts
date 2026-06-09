import { api } from './api'

const download = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

export const rapportService = {
  telechargerRpMensuel: async (mois: string): Promise<void> => {
    const res = await api.get('/rapports/rp/mensuel', { params: { mois }, responseType: 'blob' })
    download(new Blob([res.data], { type: 'application/pdf' }), `rapport-rp-${mois}.pdf`)
  },

  telechargerFinancePdf: async (mois: string): Promise<void> => {
    const res = await api.get('/rapports/finance/paiements', { params: { mois, format: 'pdf' }, responseType: 'blob' })
    download(new Blob([res.data], { type: 'application/pdf' }), `paiements-${mois}.pdf`)
  },

  telechargerFinanceExcel: async (mois: string): Promise<void> => {
    const res = await api.get('/rapports/finance/paiements', { params: { mois, format: 'excel' }, responseType: 'blob' })
    download(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `paiements-${mois}.xlsx`)
  },
}
