<template>
  <div class="customer-container">
    <el-card shadow="never">
      <template #header>
        <div>
          <div class="card-header">
            <span>属性管理</span>
          </div>

          <div class="header-filters">
            <el-form :inline="true" :model="filterForm" size="small">
              <el-form-item>
                <el-input
                  v-model="filterForm.name"
                  placeholder="属性名称"
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
                  <el-button type="primary" @click="addAttribute">添加属性</el-button>
                </div>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </template>
      
      <el-table :data="Attributes" style="width: 100%" row-key="id" v-loading="loading">
        <el-table-column prop="id" label="ID" width="180" />

        <el-table-column prop="name" label="属性名称" min-width="180" />

        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button type="text" @click="handleView(row)">查看</el-button>
            <el-button type="text" @click="handleEdit(row)">编辑</el-button>
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
      v-model="checkDialogVisible"
      title="属性详情"
      width="920px"
    >
      <div class="Attribute-view">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="属性名称">
            {{ viewAttribute.name || "-" }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <div style="display: flex; justify-content: flex-end">
          <el-button type="primary" @click="checkDialogVisible = false">
            关闭
          </el-button>
        </div>
      </template>
    </el-dialog>
    

    <el-dialog
      v-model="editDialogVisible"
      class="attribute-edit-dialog"
      :title="editForm.id ? '编辑属性' : '添加属性'"
      width="500px"
    >
      <el-form :model="editForm">
        <el-form-item label="属性名称" :label-width="formLabelWidth">
          <el-input v-model="editForm.name" autocomplete="off" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  getAttributesList,
  deleteAttributeById,
  updateAttributeById,
  addAttribute,
} from "@/api/goods";
import { getAccessToken } from "@/utils/accessToken";

export default {
  name: "Customer",
  
  data() {
    return {
      Attributes: [],
      currentPage: 1,
      pageSize: 10,
      loading: false,
      total: 0,
      filterForm: {
        name: "",
      },
      checkDialogVisible: false,
      editDialogVisible: false,
      editDialogBodyReady: false,
      editDisabled: false,
      editAttributeId: null,
      editForm: {
        name: "",
        id: null,
        parent_id: 0,
      },
      viewAttribute: {},
      filterAttributeTree : [],
      formLabelWidth: "140px",
    };
  },
  mounted() {
    this.loadAttributes();
  },
  methods: {
    resetFilters() {
      this.filterForm = {
        name: ""
      };
      this.currentPage = 1;
      this.loadAttributes();
    },

    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
      this.loadAttributes();
    },
    handleCurrentChange(val) {
      this.currentPage = val;
      this.loadAttributes();
    },
    
    search() {
      this.currentPage = 1;
      this.loadAttributes();
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

    async loadAttributes() {
      if (!this.getToken()) {
        this.loading = false;
        return;
      }
      this.loading = true;
      try {
        const res = await getAttributesList({
          page: this.currentPage,
          page_size: this.pageSize,
          ...this.getFilterParams(),
        });

        const pagination = res?.pagination || {};
        this.Attributes = res?.items || [];
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
      this.viewAttribute = row;
      this.checkDialogVisible = true;
    },

    handleEdit(row) {
      console.log("=========handleEdit=======",row);
      console.log("=========handleEdit parent_id=======",row?.parent_id);
      this.editDialogBodyReady = false;
      this.editForm = {
        name: row?.name ?? "",
        id: row?.id ?? null,
        parent_id: row?.parent_id ?? 0,
      };
      this.editDisabled = true
      this.editDialogVisible = true;
    },

    onEditDialogOpened() {
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          this.editDialogBodyReady = true;
        });
      });
    },

    onEditDialogClosed() {
      this.editDialogBodyReady = false;
    },
    
    async handleDelete(row) {
      try {
        await this.$confirm(
          `确定要删除属性"${row?.name}"吗？`,
          "提示",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }
        );

        this.loading = true;
        const res = await deleteAttributeById(row.id);
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
      await this.loadAttributes();
    },

    addAttribute() {
      this.editDialogVisible = true;
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
         const res = await updateAttributeById(this.editForm);
         if(res.code === 200) {
          this.$message.success("编辑成功");
         } else {
          this.$message.error(res.message);
         }
        } else {
          const res = await addAttribute(this.editForm);
          if(res.code === 200) {
            this.$message.success("添加成功");
          } else {
            this.$message.error(res.message);
          }
        }
        this.editDialogVisible = false;
      } catch (e) {
        // 请求失败：不关闭抽屉，便于继续修改
        return;
      } finally {
        this.loading = false;
      }

      await this.loadAttributes();
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

  .Attribute-view {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }

  .Attribute-view-poster img {
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

<!-- el-dialog 默认 teleport 到 body，scoped 无法命中；覆盖 vab.scss 中 dialog 的 border-top -->
<style lang="scss">
.attribute-edit-dialog.el-dialog {
  .el-dialog__body,
  .el-dialog__footer {
    border-top: none !important;
  }
}
</style>