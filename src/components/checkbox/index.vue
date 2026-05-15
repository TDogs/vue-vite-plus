<template>
  <div class="attribute-checkbox">
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索属性"
        clearable
        style="width: 220px"
        @keyup.enter="onSearch"
        @clear="onSearchClear"
      />
      <el-button type="primary" @click="onSearch">搜索</el-button>
    </div>

    <div class="actions">
      <el-checkbox
        :model-value="pageCheckAll"
        :indeterminate="pageIndeterminate"
        @change="togglePageAll"
      >
        全选本页
      </el-checkbox>
      <el-button type="text" @click="clearAll">取消选择</el-button>
      <span v-if="modelValue.length" class="selected-tip">
        已选 {{ modelValue.length }} 项
      </span>
    </div>

    <el-checkbox-group v-model="selected" class="list" v-loading="loading">
      <el-checkbox
        v-for="item in pageList"
        :key="item.id"
        :label="item.id"
        :value="item.id"
      >
        {{ item.name }}
      </el-checkbox>
      <div v-if="!loading && !pageList.length" class="empty">暂无数据</div>
    </el-checkbox-group>

    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      small
      class="pager"
      @current-change="fetchList"
    />
  </div>
</template>

<script>
import { getAttributeOptions } from "@/api/goods";

export default {
  name: "AttributeCheckbox",
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      keyword: "",
      page: 1,
      pageSize: 10,
      total: 0,
      pageList: [],
      loading: false,
    };
  },
  computed: {
    selected: {
      // 获取选中项
      get() {
        return this.modelValue;
      },

      // 设置选中项 赋值给父组件
      set(val) {
        this.$emit("update:modelValue", val);
      },
    },
    pageIds() {
      return this.pageList.map((item) => item.id);
    },

    // 全选本页 是否当前页的所有id都选中
    pageCheckAll() {
      return (
        this.pageIds.length > 0 &&
        this.pageIds.every((id) => this.selected.includes(id))
      );
    },

    // 部分选中
    pageIndeterminate() {
      const onPage = this.pageIds.filter((id) => this.selected.includes(id));
      return onPage.length > 0 && onPage.length < this.pageIds.length;  // 返回boolean 是否部分选中 or 全选
    },
  },
  mounted() {
    this.fetchList();
  },
  methods: {
    togglePageAll(checked) {
      const ids = this.pageIds;
      if (checked) {
        this.selected = [...new Set([...this.selected, ...ids])];
      } else {
        this.selected = this.selected.filter((id) => !ids.includes(id));
      }
    },
    clearAll() {
      this.selected = [];
    },
    onSearch() {
      this.page = 1;
      this.fetchList();
    },
    onSearchClear() {
      this.page = 1;
      this.fetchList();
    },
    async fetchList() {
      this.loading = true;
      try {
        const res = await getAttributeOptions({
          page: this.page,
          page_size: this.pageSize,
          keyword: this.keyword.trim(),
        });
        this.pageList = res?.items || [];
        this.total = res?.pagination?.total ?? res?.total ?? 0;

        // await new Promise((r) => setTimeout(r, 150));

        // const kw = this.keyword.trim();
        // let list = MOCK_ALL;
        // if (kw) {
        //   list = MOCK_ALL.filter((item) => item.name.includes(kw));
        // }
        // this.total = list.length;
        // const start = (this.page - 1) * this.pageSize;
        // this.pageList = list.slice(start, start + this.pageSize);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.attribute-checkbox {
  .toolbar {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .selected-tip {
      margin-left: auto;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 200px;
    max-height: 360px;
    overflow-y: auto;
    padding: 4px 0;
  }

  .empty {
    color: var(--el-text-color-secondary);
    font-size: 13px;
    padding: 24px 0;
    text-align: center;
  }

  .pager {
    margin-top: 16px;
    justify-content: flex-end;
  }
}
</style>
