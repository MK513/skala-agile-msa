import { defineStore } from 'pinia'
import { ref } from 'vue'
import { courseApi } from '@/api/course.js'

export const useCourseStore = defineStore('course', () => {
  const courses = ref([])
  const selectedCourse = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const selectedCategory = ref('전체')

  const categories = ['전체', '고용', 'R&D', '수출', '설비', '주거', '청년', '창업', '기타']

  // 백엔드 카테고리(enum) → 프론트 표시용 카테고리(한글 라벨)
  const categoryLabelMap = {
    EMPLOYMENT: '고용',
    RND: 'R&D',
    EXPORT: '수출',
    FACILITY: '설비',
    HOUSING: '주거',
    YOUTH: '청년',
    STARTUP: '창업',
    OTHER: '기타'
  }

  // 한글 라벨 → 백엔드 카테고리(enum), API 호출 시 사용
  const categoryValueMap = Object.fromEntries(
    Object.entries(categoryLabelMap).map(([value, label]) => [label, value])
  )

  function normalizeCategory(category) {
    if (!category) return ''
    return categoryLabelMap[category] || category
  }

  function getCategoryValue(label) {
    return categoryValueMap[label] || label
  }

  function normalizeCourse(course) {
    if (!course || typeof course !== 'object') return course

    return {
      ...course,
      category: normalizeCategory(course.category)
    }
  }

  async function fetchCourses() {
    loading.value = true
    error.value = null

    try {
      const res = await courseApi.getAll()
      console.log('[CourseStore] fetchCourses response =', res.data)

      const rawCourses = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : []

      courses.value = rawCourses.map(normalizeCourse)

      console.log('[CourseStore] normalized courses =', courses.value)
    } catch (e) {
      console.error('[CourseStore] fetchCourses failed:', e)
      error.value = e.message || '지원사업 목록을 불러오지 못했습니다.'
      courses.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchCourse(id) {
    loading.value = true
    error.value = null

    try {
      const res = await courseApi.getById(id)
      console.log('[CourseStore] fetchCourse response =', res.data)

      const rawCourse =
        res.data?.data && typeof res.data.data === 'object'
          ? res.data.data
          : res.data

      selectedCourse.value = normalizeCourse(rawCourse)

      console.log('[CourseStore] normalized selectedCourse =', selectedCourse.value)
    } catch (e) {
      console.error('[CourseStore] fetchCourse failed:', e)
      error.value = e.message || '지원사업 정보를 불러오지 못했습니다.'
      selectedCourse.value = null
    } finally {
      loading.value = false
    }
  }

  async function fetchCoursesByCategory(label) {
    loading.value = true
    error.value = null

    try {
      const res = await courseApi.getByCategory(getCategoryValue(label))
      console.log('[CourseStore] fetchCoursesByCategory response =', res.data)

      const rawCourses = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : []

      courses.value = rawCourses.map(normalizeCourse)
    } catch (e) {
      console.error('[CourseStore] fetchCoursesByCategory failed:', e)
      error.value = e.message || '지원사업 목록을 불러오지 못했습니다.'
      courses.value = []
    } finally {
      loading.value = false
    }
  }

  async function selectCategory(cat) {
    selectedCategory.value = cat

    if (cat === '전체') {
      await fetchCourses()
    } else {
      await fetchCoursesByCategory(cat)
    }
  }

  return {
    courses,
    selectedCourse,
    loading,
    error,
    categories,
    selectedCategory,
    categoryLabelMap,
    normalizeCategory,
    normalizeCourse,
    getCategoryValue,
    fetchCourses,
    fetchCourse,
    fetchCoursesByCategory,
    selectCategory
  }
})