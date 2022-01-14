<template>
  <div style="width:100%; height:100%;">
    <el-select
      style="width:100%; height:100%;"
      v-model="selectedLabels"
      multiple
      :popper-class="innerPopperClass"
      @remove-tag="removeOne"
      :filterable="filterable"
      :filter-method="innerFilterMethod"
      :reserve-keyword="reserveKeyword"
      @change="changeLabel"
      v-bind="$attrs"
      @blur="handleBlur"
      @visible-change="visibleChange"
      @focus="handleFocus"
      @clear="handleClear"
      :allow-create="false"
    >
      <template #prefix v-if="$slots.prefix">
        <slot name="prefix" />
      </template>
      <template v-if="!isSearching">
        <el-option value="__root">
          <div class="ground" @click.stop>
            <render-list
              :only-last="onlyLast"
              :list="root.childNodes"
              :level="1"
              :active-list="activeList"
              :label-key="labelKey"
              :expand-trigger="expandTrigger"
              @handle-click="handleClick"
              @handle-check="handleCheck"
            />
            <template v-for="item in maxLevellist">
              <div
                :class="`floor-item floor-position-left-${item.id + 1}`"
                :key="item.id"
                v-if="item.rendered"
                v-show="activeList.length >= item.id"
              >
                <render-list
                  :only-last="onlyLast"
                  :list="showData[item.id]"
                  :level="item.id + 1"
                  :active-list="activeList"
                  :label-key="labelKey"
                  :expand-trigger="expandTrigger"
                  @handle-click="handleClick"
                  @handle-check="handleCheck"
                />
              </div>
            </template>
          </div>
        </el-option>
      </template>
      <template v-if="isSearching">
        <el-option
          v-for="item in searchResult"
          :value="item.showLabel"
          :key="getKey(item)"
        >
          <div style="width:100%; height:100%" @click.stop="selectOne(item)">
            {{item.totalLabel}}
          </div>
        </el-option>
      </template>
    </el-select>
  </div>
</template>

<script>
import { reactive, ref, computed, watch, onMounted } from 'vue'
import TreeStore from './lib/Tree.js'
import renderList from './render-list.vue'
import { _findByObj } from './tool/unit'

export default {
  name: 'Cascader',
  components: {
    renderList
  },
  props: {
    options: {
      type: Array,
      default: () => [],
      required: true
    },
    modelValue: {
      type: Array,
      default: () => [],
      required: true
    },
    separator: {
      type: String,
      default: '-'
    },
    filterable: {
      type: Boolean,
      default: false
    },
    filterMethod: {
      type: Function
    },
    popperClass: {
      type: String,
      default: ''
    },
    reserveKeyword: {
      type: Boolean,
      default: true
    },
    valueKey: {
      type: String,
      default: 'value'
    },
    labelKey: {
      type: String,
      default: 'label'
    },
    childrenKey: {
      type: String,
      default: 'children'
    },
    expandTrigger: {
      type: String,
      default: 'click'
    },
    onlyLast: {
      type: Boolean,
      default: false
    },
    isTwoDimensionValue: {
      type: Boolean,
      default: true
    },
    showLeafLabel: {
      type: Boolean,
      default: false
    },
    checkStrictly: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'click',
    'change',
    'visible-change',
    'blur',
    'clear',
    'focus',
    'remove-tag',
    'update:modelValue'
  ],
  setup(parentProps, { emit }) {
    const props = reactive(parentProps)
    const selectedLabels = ref([])
    const selectedNodes = ref([])
    const root = ref([])
    const maxLevellist = ref([])
    const selectedIds = ref([])
    const searchResult = ref([])
    const activeList = ref([])
    const activeClass = ref('floor-width-1')
    const store = ref({})
    const showData = ref({})
    const searchText = ref('')

    const isSearching = computed(() => !(searchText.value.trim() === ''))
    const innerPopperClass = computed(() => `${props.popperClass} multi-cascader ${isSearching.value ? '' : 'multi-cascader-style'} ${activeClass.value}`)

    watch(
      () => props.options,
      () => init(),
      { deep: true }
    )

    watch(
      () => props.modelValue,
      (value) => {
        updateSelect(value, true, true)
      },
      { deep: true }
    )

    watch(selectedNodes, (nodes) => {
      emit('change', nodes.map(o => o[props.isTwoDimensionValue ? '_idArr' : props.valueKey]))
    })

    function visibleChange(v) {
      activeList.value = []
      activeClass.value = 'floor-width-1'
      if (!v) {
        searchText.value = ''
      }
      emit('visible-change', v)
    }
    function handleBlur(e) {
      searchText.value = ''
      emit('blur', e)
    }
    function handleFocus(e) {
      emit('focus', e)
    }
    function handleClear() {
      selectedNodes.value.forEach(node => {
        node.check(false)
      })
      emit('update:modelValue', [])
      emit('clear')
    }
    function selectOne(item) {
      item.checked = !item.checked
      handleCheck(item)
    }
    function changeLabel(v) {
      store.value.nodeList.forEach(node => {
        node.check(v.includes(node.showLabel))
      })
    }
    function innerFilterMethod(v) {
      searchText.value = v
      let tempResult = store.value.nodeList
      if (v.trim() !== '') {
        activeClass.value = ''
        if (typeof props.filterMethod === 'function') {
          searchResult.value = props.filterMethod(tempResult, v)
        } else {
          tempResult = tempResult.filter(o => o.isLeaf)
          tempResult = tempResult.filter(o => o.showLabel.includes(v))
          searchResult.value = tempResult
        }
      } else {
        activeClass.value = 'floor-width-1'
      }
    }
    function getKey() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }
    function handleClick(node, levelIndex, level) {
      if (maxLevellist.value[level - 1]) {
        maxLevellist.value[level - 1].rendered = true
      }
      activeClass.value = `floor-width-${node.isLeaf ? level : level + 1}`
      const tempList = [...activeList.value]
      if (level < tempList.length) {
        tempList.splice(level)
      }
      tempList[level - 1] = node.id
      showData.value[level] = node.childNodes
      activeList.value = tempList
    }
    function handleCheck(node) {
      node.check(node.checked)
      selectedIds.value = store.value.selectedIds
      updateSelect(store.value.selectedIds)
      emit('update:modelValue', selectedNodes.value.map(o => o[props.isTwoDimensionValue ? '_idArr' : props.valueKey]))
    }
    function removeOne(v) {
      const targetNode = selectedNodes.value.find(o => o.showLabel === v) || {}
      targetNode.checked = false
      handleCheck(targetNode)
      emit('remove-tag', v)
    }
    function updateSelect(data = [], needCheckNode = false, setValue = false) {
      const tempSelectedNodes = []
      const tempSelectedLabels = []
      const tempSelectedIds = []
      if (!props.checkStrictly) {
        store.value.nodeList.forEach(node => {
          node.checked && node.check(false)
        })
      }
      if (data && data.length) {
        data.forEach(o => {
          let targetNode
          if (setValue) {
            targetNode = _findByObj(store.value.nodeList, { [props.isTwoDimensionValue ? '_idArr' : props.valueKey]: o }) || {}
            tempSelectedIds.push(targetNode.id)
          } else {
            targetNode = store.value.nodesMap[o]
            tempSelectedIds.push(o)
          }
          if (targetNode) {
            needCheckNode && targetNode.check(true)
            tempSelectedNodes.push(targetNode)
            tempSelectedLabels.push(targetNode.showLabel)
          }
        })
      }
      selectedNodes.value = tempSelectedNodes
      selectedLabels.value = tempSelectedLabels
      selectedIds.value = tempSelectedIds
    }
    function init() {
      store.value = new TreeStore({
        data: props.options,
        separator: props.separator,
        valueKey: props.valueKey,
        labelKey: props.labelKey,
        childrenKey: props.childrenKey,
        showLeafLabel: props.showLeafLabel,
        checkStrictly: props.checkStrictly
      })
      root.value = store.value.root
      maxLevellist.value = Array.from({ length: store.value.maxLevel - 1 }, (v, i) => {
        showData.value[i + 1] = []
        return {
          id: i + 1,
          rendered: false
        }
      })
      updateSelect(props.modelValue, true, true)
    }

    onMounted(() => {
      init()
    })
    return {
      selectedLabels,
      selectedNodes,
      root,
      maxLevellist,
      selectedIds,
      searchResult,
      activeList,
      activeClass,
      store,
      showData,
      searchText,
      isSearching,
      innerPopperClass,
      visibleChange,
      handleBlur,
      handleFocus,
      handleClear,
      selectOne,
      changeLabel,
      innerFilterMethod,
      getKey,
      handleClick,
      handleCheck,
      removeOne
    }
  }
}
</script>

<style lang="scss">
.el-popper.multi-cascader.multi-cascader {
  .el-select-dropdown__item.selected::after {
    top: 0;
  }
}
.el-popper.multi-cascader.multi-cascader-style {
  min-width: 160px !important;
  .el-select-dropdown__list {
    padding: 0;
    position: relative;
  }
  .el-select-dropdown__item {
    padding: 0 !important;
    height: 216px !important;
    &.hover {
      background-color: #fff;
    }
  }
  .li-style {
    height: 34px;
    padding: 0px 20px;
    box-sizing: border-box;
    list-style: none;
    width: 160px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 34px;
    &:hover{
      background-color: rgba(69,200,220,.1);
    }
    &.selected {
      color: #45c8dc;
    }
    &.active-li {
      background-color: rgba(69,200,220,.1);
      color: #45c8dc;
    }
    .li-label-style{
      text-align: left;
      width: 100%;
      box-sizing: border-box;
      padding-right: 15px;
      position: relative;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      .li-label-icon {
        position: absolute;
        right: 0px;
        top: 50%;
        transform: translate(0, -50%);
      }
      .el-checkbox {
        margin-right: 10px;
      }
    }
  }
  .ground {
    width: 100%;
    height: 204px;
    padding: 6px 0;
    background: #fff;
  }
  .floor-item {
    width: 160px;
    padding: 6px 0;
    border-left: 1px solid #eee;
    position: absolute;
    top: 0;
    height: 204px;
    overflow-y: auto;
    overflow-x: hidden;
  }
}
.multi-cascader-style {
  p {
    margin: 0;
    padding: 0;
  }
  ol, ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
}

$width: 160px;
@each $i in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] {
  .multi-cascader-style.floor-width-#{$i} {
    width: $i * $width;
  }
  .multi-cascader-style .floor-position-left-#{$i} {
    left: ($i - 1) * $width;
  }
}
</style>
