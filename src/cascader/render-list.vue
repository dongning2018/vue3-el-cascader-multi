<template>
  <ul style="width:160px; max-height:100%; overflow-x: hidden; overflow-y: auto;">
    <li
      class="li-style"
      v-for="(node, nodeIndex) in list"
      :key="guid(node)"
      :class="{'active-li': activeList[level - 1] === node.id}"
      @click="handleClick(node, nodeIndex, level)"
      @mousemove="handleMouseMove(node, nodeIndex, level)"
      @mouseout="handleMouseOut"
    >
      <p class="li-label-style" v-toolTip>
        <span @click.stop v-show="!onlyLast || (onlyLast && node.isLeaf)">
          <el-checkbox
          @change="handleCheck($event, node)"
          v-model="node.checked"
          :disabled="node.disabled"
          ></el-checkbox>
        </span>
        <!-- <span style="margin-left:5px" :title="node[labelKey]">{{node[labelKey]}}</span> -->
        <template v-if="node[labelKey] && node[labelKey].length > 4">
          <el-tooltip :content="node[labelKey]" placement="top">
            <span style="margin-left:5px">{{node[labelKey]}}</span>
          </el-tooltip>
        </template>
        <template v-else>
          <span style="margin-left:5px">{{node[labelKey]}}</span>
        </template>
        <i v-if="node.childNodes && node.childNodes.length > 0" class="li-label-icon el-icon-arrow-right"></i>
      </p>
    </li>
  </ul>
</template>

<script>
import { reactive, ref, toRefs } from 'vue'
export default {
  directives: {
    toolTip: {
      inserted: function(el) {
        el.title = el.scrollWidth > el.offsetWidth ? el.innerText : ''
      }
    }
  },
  props: {
    activeList: {
      type: Array,
      default: () => []
    },
    list: {
      type: Array,
      default: () => []
    },
    level: {
      type: [Number, String]
    },
    labelKey: {
      type: String,
      default: 'label'
    },
    expandTrigger: {
      type: String,
      default: 'click'
    },
    onlyLast: {
      type: Boolean,
      default: false
    }
  },
  emits: ['handle-click', 'handle-check'],
  setup(parentProps, { emit }) {
    const props = toRefs(parentProps)
    const oldNode = ref(null)
    const oldLevelIndex = ref(null)
    const oldLevel = ref(null)
    const oldValue = reactive({
      oldNode,
      oldLevelIndex,
      oldLevel
    })

    function handleMouseOut() {
      oldNode.value = null
      oldLevelIndex.value = null
      oldLevel.value = null
    }
    // mouseEnter会一直触发，然后阻止了click事件，改为mouseMove事件
    function handleMouseMove(node, levelIndex, level) {
      if (props.expandTrigger.value !== 'hover') {
        return false
      }
      const { oldNode, oldLevelIndex, oldLevel } = oldValue
      if (
        (node === oldNode.value) &&
        (oldLevelIndex.value === levelIndex) &&
        (oldLevel.value === level)
      ) {
        return false
      } else {
        oldNode.value = node
        oldLevelIndex.value = levelIndex
        oldLevel.value = level
      }
      emit('handle-click', node, levelIndex, level)
    }
    function handleClick(node, levelIndex, level) {
      if (props.expandTrigger.value === 'click') {
        emit('handle-click', node, levelIndex, level)
      }
    }
    function handleCheck(v, node) {
      node.checked = v
      emit('handle-check', node)
    }
    function guid() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    return {
      oldValue,
      handleMouseOut,
      handleMouseMove,
      handleClick,
      handleCheck,
      guid
    }
  }
}
</script>
