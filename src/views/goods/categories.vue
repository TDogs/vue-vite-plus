<template>
  <div class="customer-container">
    <el-card shadow="never">
      <template #header>
        <div>
          <div class="card-header">
            <span>分类管理</span>
          </div>

          <div class="header-filters">
            <el-form :inline="true" :model="filterForm" size="small">
              <el-form-item>
                <el-input
                  v-model="filterForm.name"
                  placeholder="分类名称"
                  clearable
                  style="width: 220px"
                  @keyup.enter="search"
                />
              </el-form-item>

              <el-form-item class="score-with-actions">
              
                <div class="score-actions">
                  <el-button type="primary" @click="search" :loading="loading">
                    搜索
                  </el-button>
                  <el-button @click="resetFilters">重置</el-button>
                  <el-button type="primary" @click="addCategory">添加分类</el-button>
                </div>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </template>
      
      <el-table :data="categories" style="width: 100%" row-key="id" v-loading="loading">
        <el-table-column prop="id" label="ID" width="180" />

        <el-table-column prop="name" label="分类名称" min-width="180" />

        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button type="text" @click="handleView(row)">查看</el-button>
            <el-button type="text" @click="handleEdit(row)">编辑</el-button>
            <el-button type="text" @click="handleAttributeAssign(row)">属性分配</el-button>
            <el-button
              type="text"
              style="color: #f56c6c"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 查看电影弹框 -->
    <el-dialog
      v-model="movieDialogVisible"
      title="分类详情"
      width="920px"
    >
      <div class="category-view">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="分类名称">
            {{ viewCategory.name || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="所属分类">
            {{ viewCategory.parent_name || "-" }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <div style="display: flex; justify-content: flex-end">
          <el-button type="primary" @click="movieDialogVisible = false">
            关闭
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-drawer
      v-model="editDrawerVisible"
      :title="editForm.id ? '编辑分类' : '添加分类'"
      size="40%"
      destroy-on-close
      @opened="onEditDrawerOpened"
      @closed="onEditDrawerClosed"
    >
      <el-form
        v-if="editDrawerBodyReady"
        :model="editForm"
        label-width="120px"
        label-position="left"
      >
        <el-form-item label="所属分类">
          <el-select
            v-model="editForm.parent_id"
            filterable
            :disabled="editDisabled"
            placeholder="Select"
            @change="handleChange"
            style="width: 240px"
          >
            <el-option
              v-for="item in topCategoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="分类名称">
          <el-input v-model="editForm.name" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 10px">
          <el-button @click="editDrawerVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave" :loading="loading">保存</el-button>
        </div>
      </template>
    </el-drawer>
  </div>



    <!-- 分配属性 -->
    <el-dialog
      v-model="checkDialogVisible"
      title="分配属性"
      width="520px"
    >
    <!-- 卸载 checkbox 组件时，会重新渲染组件， checkedAttributes 清空，否则沿用上一个chechbox -->
     <!-- key 是 editCategoryId，当 editCategoryId 变化时，会重新渲染 checkbox 组件 -->
    <Checkbox
      v-if="checkDialogVisible" 
      :key="editCategoryId"
      v-model="checkedAttributes"
    />
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 10px">
          <el-button @click="checkDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveAttributeAssign">保存</el-button>
        </div>
      </template>
    </el-dialog>
</template>

<script>
import { Plus } from "@element-plus/icons-vue";
import {
  getCategoriesList,
  getCategoriesTree,
  deleteCategoryById,
  updateCategoryById,
  addCategory,
  getAttributeOptionsByCategoryId,
  updateCategoryAttributeById,
} from "@/api/goods";
import { getAccessToken } from "@/utils/accessToken";
import Checkbox from "@/components/checkbox/index.vue";

export default {
  name: "Customer",
  components: {
    Plus,
    Checkbox,
  },  
  data() {
    return {
      topCategoryOptions: [],
      categories: [],
      currentPage: 1,
      pageSize: 10,
      loading: false,
      total: 0,
      filterForm: {
        name: "",
      },
      movieDialogVisible: false,
      editDrawerVisible: false,
      editDrawerBodyReady: false,
      editDisabled: false,
      checkDialogVisible:false,
      editCategoryId: null,
      editForm: {
        name: "",
        id: null,
        parent_id: 0,
      },
      viewCategory: {},
      filterCategoryTree : [],
      checkedAttributes: [],
    };
  },
  mounted() {
    this.loadCategories();
    this.getCategoriesTree();
  },
  methods: {
    async handleAttributeAssign(row) {

      this.editCategoryId = row.id;
      // 获取已有属性id
      const res = await getAttributeOptionsByCategoryId(row.id);
      this.checkedAttributes = res?.items || [];
      this.checkDialogVisible = true;
    },

    async saveAttributeAssign() {
      if(!this.checkedAttributes.length) {
        this.$message.error("请选择属性");
        return;
      }
      const res = await updateCategoryAttributeById({
        category_id: this.editCategoryId,
        attribute_ids: this.checkedAttributes,
      });
      if (res.code === 200) {
        this.$message.success("保存成功");
        this.checkDialogVisible = false;
        this.loadCategories();
      } else if (res.code === 300) {
        this.$message.error(res.msg || "保存失败");
      }
    },

    handleChange(value) {
      this.editForm.parent_id = value;
    },
    
    filterMethod(value) {
      this.filterCategoryTree = [...this.topCategoryOptions].filter((item) => item.label.includes(value))
    },


    async getCategoriesTree() {
      const res = await getCategoriesTree({level: 1});
      this.filterCategoryTree = this.topCategoryOptions = res?.items || [];
      this.editForm.parent_id = this.filterCategoryTree.unshift({
        value: 0,
        label: "顶级分类",
        parent_id: null,
      });
    },

    resetFilters() {
      this.filterForm = {
        name: ""
      };
      this.currentPage = 1;
      this.loadCategories();
    },

    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
      this.loadCategories();
    },
    handleCurrentChange(val) {
      this.currentPage = val;
      this.loadCategories();
    },
    
    search() {
      this.currentPage = 1;
      this.loadCategories();
    },

    getFilterParams() {
      return {
        name: this.filterForm.name
      };
    },

    getToken() {
     let token = this.$store?.state?.user?.accessToken || getAccessToken();
      if(!token) {
        this.$message.error("请先登录");
        return;
      }
      return token;
    },

    async loadCategories() {
      if (!this.getToken()) {
        this.loading = false;
        return;
      }
      this.loading = true;
      try {
        const res = await getCategoriesList({
          page: this.currentPage,
          page_size: this.pageSize,
          ...this.getFilterParams(),
        });

        const pagination = res?.pagination || {};
        this.categories = res?.items || [];
        const total =
          pagination.total ?? res?.total ?? res?.data?.total ?? items.length;
        this.total = Number(total) || 0;
      } catch (e) {
        // 失败就让列表为空，避免页面渲染报错
        this.total = 0;
      }
      this.loading = false;
    },

    handleView(row) {
      this.viewCategory = row;
      this.viewCategory.parent_name = this.topCategoryOptions.find(item => item.value == row?.parent_id)?.label || "-";
      this.movieDialogVisible = true;
    },

    handleEdit(row) {
      console.log("=========handleEdit=======",row);
      console.log("=========handleEdit parent_id=======",row?.parent_id);
      this.editDrawerBodyReady = false;
      this.editForm = {
        name: row?.name ?? "",
        id: row?.id ?? null,
        parent_id: row?.parent_id ?? 0,
      };
      this.editDisabled = true
      this.editDrawerVisible = true;
    },

    onEditDrawerOpened() {
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          this.editDrawerBodyReady = true;
        });
      });
    },

    onEditDrawerClosed() {
      this.editDrawerBodyReady = false;
    },
    
    async handleDelete(row) {
      try {
        await this.$confirm(
          `确定要删除分类"${row?.name}"吗？`,
          "提示",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }
        );

        this.loading = true;
        const res = await deleteCategoryById(row.id);
        if (res.code === 200) {
          this.$message.success("删除成功");
        } else {
          this.$message.error(res.message);
        }
      } catch (e) {
        // 取消删除不报错
      } finally {
        this.loading = false;
      }

      // 删除后刷新当前页数据
      await this.loadCategories();
    },

    addCategory() {
      this.editDrawerVisible = true;
      this.editForm = {
        name: "",
        id: null,
        parent_id: null,
      };
      this.editDisabled = false;
    },
  

    async handleSave() {
      // const id = this.editForm.id;
      // if (!id) return;

      console.log("=========handleSave editForm=======",this.editForm);
      try {
        this.loading = true;
        if(this.editForm.id) {
          await updateCategoryById(this.editForm);
        } else {
          await addCategory(this.editForm);
        }
        this.editDrawerVisible = false;
        this.$message.success("编辑成功");
      } catch (e) {
        // 请求失败：不关闭抽屉，便于继续修改
        return;
      } finally {
        this.loading = false;
      }

      await this.loadCategories();
    },
  }
};
</script>

<style lang="scss" scoped>
.customer-container {
  padding: 20px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }
  
  .customer-name {
    display: flex;
    align-items: center;
  }
  
  .customer-avatar-detail {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    color: white;
    margin: 0 auto;
  }
  
  .pagination-container {
    margin-top: 20px;
    text-align: right;
  }

  .category-view {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }

  .category-view-poster img {
    width: 120px;
    height: 180px;
    border-radius: 8px;
    object-fit: cover;
    display: block;
    margin-top: 0.2pc;
  }

  .drama-text {
    white-space: pre-wrap;
    line-height: 1.6;
  }

  .poster-upload-hint {
    margin-top: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
  }

  .header-filters {
    margin-top: 12px;
    padding: 0 2px;

    :deep(.el-form-item) {
      margin-right: 10px;
      margin-bottom: 6px;
    }

    .form-break {
      flex-basis: 100%;
      height: 0;
    }

    .range-sep {
      display: inline-block;
      padding: 0 6px;
      color: #909399;
    }

    :deep(.el-form-item.score-with-actions) {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    :deep(.el-form-item.score-with-actions .score-actions) {
      margin-left: auto;
      display: flex;
      gap: 10px;
      align-items: center;
    }
  }
}
</style>