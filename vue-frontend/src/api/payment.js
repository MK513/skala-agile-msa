import api from './index.js'

export const paymentApi = {
  // 사용자별 교부(결제) 내역 조회
  getByUser(userId) {
    return api.get(`/api/payments/user/${userId}`)
  },

  // 교부 단건 조회
  getById(id) {
    return api.get(`/api/payments/${id}`)
  }
}
