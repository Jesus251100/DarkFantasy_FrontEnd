import { api } from '../api/cliente'
import type {
  EventoActividad,
  IConsultasAdmin,
  RegistroReciente,
  ReportesAdmin,
  ResumenUsuarioAdmin,
  TransaccionReciente,
} from '../domain/admin/IConsultasAdmin'

export class ApiAdminCliente implements IConsultasAdmin {
  async listarUsuarios(): Promise<ResumenUsuarioAdmin[]> {
    const data = await api<{ usuarios: ResumenUsuarioAdmin[] }>('/api/admin/usuarios')
    return data.usuarios
  }

  async reportes(): Promise<ReportesAdmin> {
    return api<ReportesAdmin>('/api/admin/reportes')
  }

  async actividad() {
    return api<{
      partidas: EventoActividad[]
      registros: RegistroReciente[]
      transacciones: TransaccionReciente[]
    }>('/api/admin/actividad')
  }
}
