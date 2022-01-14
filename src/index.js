import Cascader from './cascader/index.vue'

const install = (Vue) => {
  Vue.component(Cascader.name, Cascader)
}
if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue)
}
export default { install }
