<template>
  <div class="customer-container">
    <el-card shadow="never">
      <template #header>
        <div>
          <div class="card-header">
            <span>电影管理</span>
          </div>

          <div class="header-filters">
            <el-form :inline="true" :model="filterForm" size="small">
              <el-form-item>
                <el-input
                  v-model="filterForm.name"
                  placeholder="电影名"
                  clearable
                  style="width: 220px"
                  @keyup.enter="search"
                />
              </el-form-item>


              <el-form-item>
                <el-input
                  v-model="filterForm.director"
                  placeholder="导演"
                  clearable
                  style="width: 220px"
                  @keyup.enter="search"
                />
              </el-form-item>

              <el-form-item>
                <el-input
                  v-model="filterForm.actor"
                  placeholder="演员"
                  clearable
                  style="width: 220px"
                  @keyup.enter="search"
                />
              </el-form-item>

              <el-form-item>
                <el-input
                  v-model="filterForm.genre"
                  placeholder="类型"
                  clearable
                  style="width: 220px"
                  @keyup.enter="search"
                />
              </el-form-item>

              <el-form-item>
                <el-input
                  v-model="filterForm.area"
                  placeholder="地区"
                  clearable
                  style="width: 220px"
                  @keyup.enter="search"
                />
              </el-form-item>

              <div class="form-break" />

           
              <el-form-item>
                <el-date-picker
                  v-model="filterForm.releaseDateRange"
                  type="daterange"
                  value-format="YYYY-MM-DD"
                  start-placeholder="上映开始"
                  end-placeholder="上映结束"
                />
              </el-form-item>


              <div class="form-break" />


              <el-form-item>
                <el-input-number
                  v-model="filterForm.durationMin"
                  :min="0"
                  :precision="0"
                  placeholder="时长最小"
                  style="width: 175px"
                />
                <span class="range-sep">-</span>
                <el-input-number
                  v-model="filterForm.durationMax"
                  :min="0"
                  :precision="0"
                  placeholder="时长最大"
                  style="width: 175px"
                />
              </el-form-item>

              <div class="form-break" />



              <el-form-item class="score-with-actions">
                <el-input-number
                  v-model="filterForm.scoreMin"
                  :min="0"
                  :max="10"
                  :step="0.1"
                  :precision="1"
                  placeholder="评分最小"
                  style="width: 175px"
                />
                <span class="range-sep">-</span>
                <el-input-number
                  v-model="filterForm.scoreMax"
                  :min="0"
                  :max="10"
                  :step="0.1"
                  :precision="1"
                  placeholder="评分最大"
                  style="width: 175px"
                />
                <div class="score-actions">
                  <el-button type="primary" @click="search" :loading="loading">
                    搜索
                  </el-button>
                  <el-button @click="resetFilters">重置</el-button>
                </div>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </template>
      
      <el-table :data="customers" style="width: 100%" row-key="id" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />

        <el-table-column label="海报" width="120">
          <template #default="{ row }">
            <img
              :src="firstPosterUrl(row.poster_url) || defaultPoster"
              alt="海报"
              style="
                width: 40px;
                height: 60px;
                border-radius: 4px;
                object-fit: cover;
              "
              @error="handlePosterError"
            />
          </template>
        </el-table-column>

        <el-table-column prop="title" label="电影名称" min-width="180" />

        <el-table-column label="类型" min-width="220">
          <template #default="{ row }">
            {{ formatStringArray(row.categories) }}
          </template>
        </el-table-column>

        <el-table-column prop="region" label="地区" min-width="200" />

        <el-table-column label="片长" width="110">
          <template #default="{ row }">
            {{ row.duration_minutes }}
          </template>
        </el-table-column>

        <el-table-column label="上映日期" width="170">
          <template #default="{ row }">
            {{ formatDate(row.release_date) }}
          </template>
        </el-table-column>

        <el-table-column label="评分" width="110">
          <template #default="{ row }">
            {{ row.rating ?? "-" }}
          </template>
        </el-table-column>

        <el-table-column label="导演" min-width="220">
          <template #default="{ row }">
            {{ formatDirectorNames(row.directors) }}
          </template>
        </el-table-column>

        <el-table-column label="演员" min-width="260">
          <template #default="{ row }">
            {{ formatActors(row.actors, 8) }}
          </template>
        </el-table-column>

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
      v-model="viewDialogVisible"
      title="电影详情"
      width="920px"
    >
      <div class="movie-view">
        <div class="movie-view-poster">
          <img
            :src="firstPosterUrl(viewMovie.poster_url) || defaultPoster"
            alt="海报"
            @error="handlePosterError"
          />
        </div>

        <el-descriptions :column="1" border>
          <el-descriptions-item label="电影名">
            {{ viewMovie.title || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="导演">
            {{ formatDirectorNames(viewMovie.directors) }}
          </el-descriptions-item>
          <el-descriptions-item label="评分">
            {{ viewMovie.rating ?? "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="上映日期">
            {{ formatDate(viewMovie.release_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="片长">
            {{ viewMovie.duration_minutes ?? "-" }} 分钟
          </el-descriptions-item>
          <el-descriptions-item label="地区">
            {{ viewMovie.region || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="类型">
            {{ formatStringArray(viewMovie.categories) }}
          </el-descriptions-item>
          <el-descriptions-item label="drama介绍">
            <div class="drama-text">{{ viewMovie.drama || "-" }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <div style="display: flex; justify-content: flex-end">
          <el-button type="primary" @click="viewDialogVisible = false">
            关闭
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑电影抽屉 -->
    <el-drawer
      v-model="editDrawerVisible"
      title="编辑电影"
      size="40%"
    >
      <el-form :model="editForm" label-width="120px" label-position="left">
        <el-form-item label="导演">
          <el-input v-model="editForm.director" placeholder="多个用逗号分隔" />
        </el-form-item>

        <el-form-item label="评分">
          <el-input-number
            v-model="editForm.rating"
            :min="0"
            :max="10"
            :step="0.1"
            :precision="1"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="上映日期">
          <el-date-picker
            v-model="editForm.release_date"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="片长">
          <el-input-number
            v-model="editForm.duration_minutes"
            :min="0"
            :precision="0"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="地区">
          <el-input v-model="editForm.region" />
        </el-form-item>

        <el-form-item label="类型">
          <el-input
            v-model="editForm.categories"
            placeholder="多个用逗号分隔"
          />
        </el-form-item>

        <el-form-item label="海报">
          <upload-images
            :id="editMovieId"
            :key="editMovieId"
            v-model:poster_urls="editForm.gallery_urls"
            @update:poster_urls="handlePosterUrlsUpdate"
            @remove="handlePosterRemove"
            :limit="6"
            :max-size-mb="5"
          />
        </el-form-item>

        <el-form-item label="drama介绍">
          <el-input
            v-model="editForm.drama"
            type="textarea"
            :rows="6"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 10px">
          <el-button @click="editDrawerVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEdit">保存</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script>
import defaultPosterImg from "@/assets/error_images/404.png";
import {
  getMoviesList,
  deleteMovieById,
  updateMovieById,
} from "@/api/movies";
import { getAccessToken } from "@/utils/accessToken";
import UploadImages from "@/components/upload/index.vue";

export default {
  name: "Customer",
  components: { UploadImages },
  data() {
    return {
      currentPage: 1,
      pageSize: 10,
      loading: false,
      total: 0,
      filterForm: {
        name: "",
        genre: "",
        area: "",
        durationMin: null,
        durationMax: null,
        director: "",
        actor: "",
        scoreMin: null,
        scoreMax: null,
        releaseDateRange: [],
      },
      viewDialogVisible: false,
      viewMovie: {},
      editDrawerVisible: false,
      editMovieId: null,  // 编辑电影ID
      editForm: {
        director: "",
        rating: null,
        release_date: "",
        duration_minutes: null,
        region: "",
        categories: "",
        poster_url: "",
        /** 回显 */
        gallery_urls: [],
        drama: "",
      },
      customerDialogVisible: false,
      detailDialogVisible: false,
      contactDialogVisible: false,
      defaultPoster: defaultPosterImg,
      activeTab: "transactions",
      editingCustomer: null,
      customers: [],
      // 详情弹窗的地区级联原本填了一堆模板假数据；当前列表页不会使用，直接清空
      regionOptions: [],
      customerForm: {
        name: "",
        contact: "",
        phone: "",
        email: "",
        level: "normal",
        region: [],
        address: ""
      },
      detailCustomer: {},
      contactForm: {
        contactPerson: "",
        method: "电话",
        content: ""
      },
      customerRules: {
        name: [
          { required: true, message: "请输入电影名称", trigger: "blur" }
        ],
        contact: [
          { required: true, message: "请输入联系人", trigger: "blur" }
        ],
        phone: [
          { required: true, message: "请输入联系电话", trigger: "blur" }
        ],
        email: [
          { required: true, message: "请输入邮箱", trigger: "blur" },
          { type: "email", message: "请输入正确的邮箱地址", trigger: "blur" }
        ],
        level: [
          { required: true, message: "请选择电影等级", trigger: "change" }
        ],
        region: [
          { required: true, message: "请选择所在地区", trigger: "change" }
        ]
      },
      contactRules: {
        contactPerson: [
          { required: true, message: "请输入联系人", trigger: "blur" }
        ],
        method: [
          { required: true, message: "请选择联系方式", trigger: "change" }
        ],
        content: [
          { required: true, message: "请输入联系内容", trigger: "blur" }
        ]
      },
      // 模板假数据清空：当前列表页不展示交易/联系记录
      customerTransactions: [],
      customerContacts: []
    };
  },
  mounted() {
    this.loadMovies();
  },
  methods: {
    handlePosterUrlsUpdate(next) {
      console.log("=========更新后和图片数组========");
      console.log(next);
      console.log("=========更新后和图片数组========");
      const count = Array.isArray(next) ? next.length : 0;
      this.$message.success(`海报已更新，剩余（${count} 张）`);
    },

    handlePosterRemove(payload) {
      /**
        但是需要后端拼接回显数组如下格式：
        editForm.gallery_urls = [
          { id: 1, path: "url1" },
          { id: 2, path: "url2" },
        ]
        */
      // payload: { id, path }
      console.log("=========handlePosterRemove========");
      console.log(payload);
      console.log(payload.id);
      console.log("=========handlePosterRemove========");
    },

    search() {
      this.currentPage = 1;
      this.loadMovies();
    },
    resetFilters() {
      this.filterForm = {
        name: "",
        genre: "",
        area: "",
        durationMin: null,
        durationMax: null,
        director: "",
        actor: "",
        scoreMin: null,
        scoreMax: null,
        releaseDateRange: [],
      };
      this.currentPage = 1;
      this.loadMovies();
    },
    getFilterParams() {
      const [start, end] = Array.isArray(this.filterForm.releaseDateRange)
        ? this.filterForm.releaseDateRange
        : [];
      return {
        name: this.filterForm.name,
        genre: this.filterForm.genre,
        area: this.filterForm.area,
        duration_min: this.filterForm.durationMin,
        duration_max: this.filterForm.durationMax,
        director: this.filterForm.director,
        actor: this.filterForm.actor,
        score_min: this.filterForm.scoreMin,
        score_max: this.filterForm.scoreMax,
        release_date_start: start,
        release_date_end: end,
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

    async loadMovies() {
      this.loading = true;
      try {
        const res = await getMoviesList(this.getToken(), {
          page: this.currentPage,
          page_size: this.pageSize,
          ...this.getFilterParams(),
        });

        const pagination = res?.pagination || {};
        const items =
          (Array.isArray(pagination.items) && pagination.items) ||
          (Array.isArray(res?.items) && res.items) ||
          (Array.isArray(res?.data?.items) && res.data.items) ||
          [];

        this.customers = items;
        const total =
          pagination.total ?? res?.total ?? res?.data?.total ?? items.length;
        this.total = Number(total) || 0;
      } catch (e) {
        // 失败就让列表为空，避免页面渲染报错
        this.customers = [];
        this.total = 0;
      }
      this.loading = false;
    },

    handleView(row) {
      console.log("=========222=======");
      console.log(row);
      console.log("=========222=======");
      // this.viewMovie = { ...row };
      this.viewMovie = row;
      this.viewDialogVisible = true;
    },

    handleEdit(row) {
      this.editMovieId = row?.id ?? null;
      const posterRaw = row?.poster_url ?? "";
      // const gallery_urls = Array.isArray(row?.gallery_urls)
      //   ? row.gallery_urls
      //   : posterRaw.split(/[,，]/).filter(Boolean);

      // 如下是升级后支持格式：后端应返回格式 测试用
     let gallery_urls = [
          { id: 1, path: "https://p0.meituan.net/movie/70de97ebb6b5251ecb7c3f6d7a782a7f189340.jpg@464w_644h_1e_1c" },
          { id: 2, path: "https://p0.meituan.net/movie/396266d8b711958841b3536a3fa7b868211445.jpg@464w_644h_1e_1c" },
        ];
      console.log("=========handleEdit========");
      console.log(gallery_urls);
      console.log("=========handleEdit========");
      this.editForm = {
        director: Array.isArray(row?.directors)
          ? row.directors.map((d) => d?.name).filter(Boolean).join("，")
          : "",
        rating: row?.rating ?? null,
        release_date: row?.release_date ?? "",
        duration_minutes: row?.duration_minutes ?? null,
        region: row?.region ?? "",
        categories: Array.isArray(row?.categories)
          ? row.categories.join("，")
          : "",
        gallery_urls,
        drama: row?.drama ?? "",
      };
      this.editDrawerVisible = true;
    },

    async handleDelete(row) {
      try {
        await this.$confirm(
          `确定要删除电影"${row?.title || row?.name}"吗？`,
          "提示",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }
        );

        this.loading = true;
        res = await deleteMovieById(this.getToken(), { id });
        if(res.code === 200) {
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
      await this.loadMovies();
    },

    parseDelimitedToList(value) {
      return String(value || "")
        .split(/[，,、]/)
        .map((s) => s.trim())
        .filter(Boolean);
    },

    async saveEdit() {
      const id = this.editMovieId;
      if (!id) return;

      const directors = this.parseDelimitedToList(this.editForm.director).map(
        (name) => ({ name })
      );
      const categories = this.parseDelimitedToList(this.editForm.categories);
      // ，美术
      console.log("=========444=======");
      console.log(categories);
      console.log("=========444=======");
      const galleryRaw = Array.isArray(this.editForm.gallery_urls)
        ? this.editForm.gallery_urls
        : [];
      const gallery = galleryRaw
        .map((x) => (x && typeof x === "object" ? x.path || x.url : x))
        .filter(Boolean);
      const next = {
        directors,
        rating: this.editForm.rating,
        release_date: this.editForm.release_date,
        duration_minutes: this.editForm.duration_minutes,
        region: this.editForm.region,
        categories,
        poster_url: gallery.length ? gallery.join(",") : "",
        drama: this.editForm.drama,
      };

      try {
        this.loading = true;
        await updateMovieById(this.getToken(), { id, ...next });
        this.editDrawerVisible = false;
        this.$message.success("编辑成功");
      } catch (e) {
        // 请求失败：不关闭抽屉，便于继续修改
        return;
      } finally {
        this.loading = false;
      }

      await this.loadMovies();
    },

    handlePosterError(event) {
      event.target.src = this.defaultPoster;
    },

    /** 海报字段可能存多张 URL（逗号分隔），列表/详情只展示第一张 */
    firstPosterUrl(posterField) {
      if (!posterField) return "";
      const first = String(posterField).split(/[,，]/)[0]?.trim();
      return first || "";
    },

    formatStringArray(list) {
      if (!Array.isArray(list) || list.length === 0) return "-";
      return list.join("、");
    },

    formatDate(dateStr) {
      if (!dateStr) return "-";
      // 兼容 "YYYY-MM-DD" 与 "YYYY-MM-DDTHH:mm:ssZ"
      if (typeof dateStr === "string" && dateStr.includes("T")) {
        return dateStr.slice(0, 10);
      }
      return dateStr;
    },

    formatDirectorNames(directors, limit = 3) {
      if (!Array.isArray(directors) || directors.length === 0) return "-";
      const names = directors.map((d) => d?.name).filter(Boolean);
      if (names.length === 0) return "-";
      // limit <= 0 表示不截断（详情弹框展示全部）
      if (!limit || limit <= 0) return names.join("、");
      const sliced = names.slice(0, limit);
      const suffix = names.length > limit ? "等" : "";
      return sliced.join("、") + suffix;
    },

    formatActors(actors, limit = 8) {
      if (!Array.isArray(actors) || actors.length === 0) return "-";
      // 分割一部分
      const names = actors
        .map((a) => a?.name)
        .filter(Boolean)
        .slice(0, limit);
      const suffix = actors.length > limit ? "等" : "";
      return names.join("、") + suffix;
    },

    formatCast(cast) {
      if (!cast) return "-";
      let value = cast;
      const list = Array.isArray(value) ? value : [value];
      return list.map(item => item?.name).filter(Boolean).join("、") || "-";
    },

    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
      this.loadMovies();
    },
    handleCurrentChange(val) {
      this.currentPage = val;
      this.loadMovies();
    },
    getLevelText(level) {
      const levelMap = {
        "normal": "普通电影",
        "important": "重要电影",
        "vip": "VIP电影"
      };
      return levelMap[level] || level;
    },
    getLevelType(level) {
      const typeMap = {
        "normal": "info",
        "important": "warning",
        "vip": "success"
      };
      return typeMap[level] || "info";
    },
    getTransactionStatusText(status) {
      const statusMap = {
        "pending": "待处理",
        "processing": "处理中",
        "completed": "已完成",
        "cancelled": "已取消"
      };
      return statusMap[status] || status;
    },
    getTransactionStatusType(status) {
      const typeMap = {
        "pending": "info",
        "processing": "warning",
        "completed": "success",
        "cancelled": "danger"
      };
      return typeMap[status] || "info";
    },
    getRegionText(region) {
      return region ? region.join(" - ") : "";
    },
    getAvatarColor(name) {
      const colors = ["#409EFF", "#67C23A", "#E6A23C", "#F56C6C", "#909399"];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % colors.length;
      return colors[index];
    },
    showAddCustomerDialog() {
      this.editingCustomer = null;
      this.customerForm = {
        name: "",
        contact: "",
        phone: "",
        email: "",
        level: "normal",
        region: [],
        address: ""
      };
      this.customerDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.customerFormRef.resetFields();
      });
    },
    editCustomer(customer) {
      this.editingCustomer = customer;
      this.customerForm = { ...customer };
      this.customerDialogVisible = true;
      this.detailDialogVisible = false;
    },
    viewCustomer(customer) {
      this.detailCustomer = { ...customer };
      this.detailDialogVisible = true;
    },
    deleteCustomer(customer) {
      this.$confirm(`确定要删除电影"${customer.name}"吗？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(() => {
        const index = this.customers.findIndex(c => c.id === customer.id);
        if (index !== -1) {
          this.customers.splice(index, 1);
          this.$message.success("电影删除成功");
        }
      }).catch(() => {
        this.$message.info("已取消删除");
      });
    },
    saveCustomer() {
      this.$refs.customerFormRef.validate((valid) => {
        if (valid) {
          if (this.editingCustomer) {
            // 编辑电影
            const index = this.customers.findIndex(c => c.id === this.editingCustomer.id);
            if (index !== -1) {
              this.customers[index] = { ...this.editingCustomer, ...this.customerForm };
              this.$message.success("电影信息更新成功");
            }
          } else {
            // 添加电影
            const newCustomer = {
              id: Date.now(),
              createTime: new Date().toLocaleString(),
              ...this.customerForm
            };
            this.customers.push(newCustomer);
            this.$message.success("电影添加成功");
          }
          this.customerDialogVisible = false;
        }
      });
    },
    showAddContactDialog() {
      this.contactForm = {
        contactPerson: "",
        method: "电话",
        content: ""
      };
      this.contactDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.contactFormRef.resetFields();
      });
    },
    saveContact() {
      this.$refs.contactFormRef.validate((valid) => {
        if (valid) {
          this.customerContacts.unshift({
            ...this.contactForm,
            date: new Date().toLocaleString()
          });
          this.$message.success("联系记录添加成功");
          this.contactDialogVisible = false;
        }
      });
    }
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

  .movie-view {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }

  .movie-view-poster img {
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