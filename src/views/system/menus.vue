<template>
  <div class="menu-container">
    <el-card shadow="never">
      <div class="toolbar">
        <el-button type="primary" @click="openCreateDialog(null)">新增顶级菜单</el-button>
        <el-button @click="fetchList">刷新</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="list"
        row-key="id"
        border
        default-expand-all
        :tree-props="{ children: 'children' }"
        style="width: 100%"
      >
        <el-table-column label="名称" prop="title" min-width="180" show-overflow-tooltip />
        <el-table-column label="路径" prop="path" min-width="180" show-overflow-tooltip />
        <el-table-column label="图标" prop="icon" width="140" />
        <el-table-column label="排序" prop="sort" width="90" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="text" @click="openCreateDialog(row)" :disabled="!canAddChild(row)">
              新增二级
            </el-button>
            <el-button type="text" @click="openEditDialog(row)">编辑</el-button>
            <el-button type="text" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="类型">
          <el-tag v-if="form.parentId">二级菜单</el-tag>
          <el-tag v-else type="success">顶级菜单</el-tag>
        </el-form-item>

        <el-form-item label="名称" prop="title">
          <el-input v-model="form.title" maxlength="20" show-word-limit />
        </el-form-item>

        <el-form-item label="路径" prop="path">
          <el-input v-model="form.path" placeholder="/system/menu" />
        </el-form-item>

        <el-form-item label="图标">
          <el-input v-model="form.icon" placeholder="cog" />
        </el-form-item>

        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>

        <el-form-item label="父级" v-if="isCreate || isEditChild">
          <el-select v-model="form.parentId" placeholder="顶级菜单" clearable :disabled="!isEditChild && !isCreateChild">
            <el-option v-for="item in topLevelOptions" :key="item.id" :label="item.title" :value="item.id" />
          </el-select>
          <div class="hint">最多支持二级菜单：父级只能选顶级菜单。</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  createSystemMenu,
  deleteSystemMenu,
  getSystemMenuTree,
  updateSystemMenu,
} from "@/api/systemMenu";

export default {
  name: "SystemMenu",
  data() {
    return {
      loading: false,
      saving: false,
      list: [],
      dialogVisible: false,
      dialogMode: "create", // create | edit
      form: {
        id: null,
        title: "",
        path: "",
        icon: "",
        sort: 0,
        parentId: null,
      },
      rules: {
        title: [{ required: true, message: "请输入名称", trigger: "blur" }],
        path: [{ required: true, message: "请输入路径", trigger: "blur" }],
      },
    };
  },
  computed: {
    dialogTitle() {
      return this.dialogMode === "create" ? "新增菜单" : "编辑菜单";
    },
    topLevelOptions() {
      return (this.list || []).map((x) => ({ id: x.id, title: x.title }));
    },
    isCreate() {
      return this.dialogMode === "create";
    },
    isCreateChild() {
      return this.isCreate && !!this.form.parentId;
    },
    isEditChild() {
      return this.dialogMode === "edit" && !!this.form.parentId;
    },
  },
  created() {
    this.fetchList();
  },
  methods: {
    canAddChild(row) {
      // 只能给顶级菜单新增二级
      return !row.parentId;
    },
    async fetchList() {
      this.loading = true;
      try {
        const { data } = await getSystemMenuTree();
        this.list = Array.isArray(data) ? data : [];
      } finally {
        this.loading = false;
      }
    },
    resetForm() {
      this.form = {
        id: null,
        title: "",
        path: "",
        icon: "",
        sort: 0,
        parentId: null,
      };
      this.$nextTick(() => {
        this.$refs.formRef && this.$refs.formRef.clearValidate();
      });
    },
    openCreateDialog(parentRow) {
      this.dialogMode = "create";
      this.resetForm();
      if (parentRow) {
        this.form.parentId = parentRow.id;
      }
      this.dialogVisible = true;
    },
    openEditDialog(row) {
      this.dialogMode = "edit";
      this.resetForm();
      this.form = {
        id: row.id,
        title: row.title,
        path: row.path,
        icon: row.icon || "",
        sort: row.sort || 0,
        parentId: row.parentId || null,
      };
      this.dialogVisible = true;
    },
    async onSubmit() {
      const formRef = this.$refs.formRef;
      if (!formRef) return;
      await formRef.validate();

      this.saving = true;
      try {
        if (this.dialogMode === "create") {
          await createSystemMenu(this.form);
        } else {
          await updateSystemMenu(this.form);
        }
        this.$message.success("保存成功");
        this.dialogVisible = false;
        await this.fetchList();
      } finally {
        this.saving = false;
      }
    },
    async onDelete(row) {
      try {
        await this.$confirm("确认删除该菜单？删除顶级菜单将同时删除其二级菜单。", "提示", {
          type: "warning",
        });
      } catch (e) {
        return;
      }
      await deleteSystemMenu({ id: row.id });
      this.$message.success("删除成功");
      await this.fetchList();
    },
  },
};
</script>

<style lang="scss" scoped>
.menu-container {
  padding: 20px;

  .toolbar {
    display: flex;
    gap: 10px;
    margin-bottom: 14px;
  }

  .hint {
    margin-top: 6px;
    font-size: 12px;
    color: #999;
  }
}
</style>

