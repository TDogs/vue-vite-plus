
<template>
  <div class="upload-images-wrap">
    <el-upload
      list-type="picture-card"
      :http-request="doCustomUpload"
      :before-upload="beforeUpload"
      :on-success="onUploadSuccess"
      :on-remove="onRemove"
      :file-list="fileList"
      :limit="limit"
      :accept="acceptAttr"
      multiple
    >
      <el-icon><Plus /></el-icon>
    </el-upload>
    <div v-if="hintText" class="upload-hint">{{ hintText }}</div>
  </div>
</template>

<script>
import { Plus } from "@element-plus/icons-vue";
import { uploadFile } from "@/api/upload";


// function pickImageUrl(res) {
//   if (!res) return "";
//   const d = res.data;
  
//   if (typeof d === "string") return d;
//   if (d && typeof d.url === "string") return d.url;
//   if (d && typeof d.file_url === "string") return d.file_url;
//   if (typeof res.url === "string") return res.url;
//   return "";
// }

export default {
  name: "UploadImages",
  components: { Plus },
  props: {
    // v-model：已上传图片 URL 列表（用于回显与提交）
    poster_urls: {
      type: Array,
      default: () => [],
    },
    limit: {
      type: Number,
      default: 9,
    },
    maxSizeMb: {
      type: Number,
      default: 5,
    },
    acceptExts: {
      type: Array,
      default: () => [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    },
    id: {
      type: Number,
      default: 0,
    },
  },
  emits: ["update:poster_urls", "remove"],
  computed: {
    // 传给 el-upload 的 accept（浏览器筛选）
    acceptAttr() {
      return this.acceptExts.join(",");
    },
    hintText() {
      const extStr = this.acceptExts.join("、");
      return `最多 ${this.limit} 张，单张不超过 ${this.maxSizeMb}MB，格式：${extStr}`;
    },

    fileList() {
      const list = Array.isArray(this.poster_urls) ? this.poster_urls : [];
      return list
        .map((item, index) => {
          const isObj = item && typeof item === "object";
          const url = isObj ? item.path || item.url : item;
          if (!url) return null;
          const itemId = isObj ? item.id : undefined;
          return {
            uid: `preset-${itemId ?? index}-${url}`,
            name: this.basename(url) || `image-${index + 1}`,
            url,
            status: "success",
            itemId,
          };
        })
        .filter(Boolean);
    },
  },
  methods: {
    basename(url) {
      try {
        const u = String(url);
        const noQuery = u.split("?")[0];
        const seg = noQuery.split("/");
        return seg[seg.length - 1] || "";
      } catch {
        return "";
      }
    },

    /**
     * 上传前文件验证
     */
    beforeUpload(rawFile) {
      const name = rawFile.name || ""; // 文件名
      const lower = name.toLowerCase(); // 文件名小写
      const dot = lower.lastIndexOf("."); // 定位文件后缀的点
      const ext = dot >= 0 ? lower.slice(dot) : ""; // 文件后缀
      const allowed = this.acceptExts.map((e) => e.toLowerCase()); // 允许的后缀名数组

      console.log("=========ext========");
      console.log(ext);
      console.log("=========ext========");
      console.log("=========allowed========");
      console.log(allowed);
      console.log("=========allowed========");
      console.log("=========rawFile========");
      console.log(rawFile);
      console.log("=========rawFile========");
      if (!ext || !allowed.includes(ext)) {
        this.$message.error(`仅支持：${allowed.join("、")}`);
        return false;
      }
      const maxBytes = this.maxSizeMb * 1024 * 1024;
      if (rawFile.size > maxBytes) {
        this.$message.error(`单张图片不能超过 ${this.maxSizeMb}MB`);
        return false;
      }
      return true;
    },

    async doCustomUpload(options) {
      const { file, onSuccess, onError } = options;
      console.log("=========doCustomUpload========");
      console.log(options);
      console.log("=========doCustomUpload========");
      try {
        const res = await uploadFile(file,this.id);
        onSuccess(res);
      } catch (e) {
        onError(e);
      }
    },

    /**
     * 3：上传成功，解析 URL 并写回 v-model
     */
    onUploadSuccess(res) {
      // const url = pickImageUrl(res);
 
      console.log("=========onUploadSuccess========");
      console.log(res);
      console.log(res.data);
      console.log(res.data.id); // 暂无
      console.log(res.data.file_path);
      console.log("=========onUploadSuccess========");

      if (!res.data.file_path) {
        this.$message.error("上传成功但未解析到图片地址，请检查后端返回结构");
        return;
      }
      const current = Array.isArray(this.poster_urls) ? this.poster_urls : [];
      const useObjectModel = current.some((x) => x && typeof x === "object"); // 判断是否使用对象模型
      const filePath = res.data.file_path; // 图片地址
      const fileId = res.data.id ?? res.data.file_id ?? 100;  // 默认100 写死
      const next = useObjectModel
        ? [...current, { id: fileId, path: filePath }]
        : [...current, filePath]; // 根据上面判断 使用对象 or 数组
      this.$emit("update:poster_urls", next);  // 更新v-model 并传给父组件
    },

    /**
     * 步骤4：从列表移除一张，同步更新 v-model 支持俩中数据格式
     */
    onRemove(file) {
      console.log("=========onRemove========");
      console.log(file);
      console.log("=========onRemove========");
      const removeUrl = file.url; 

      const current = Array.isArray(this.poster_urls) ? this.poster_urls : [];

      const useObjectModel = current.some((x) => x && typeof x === "object");

      const removeId = file.itemId;

      let next = [];

      if (useObjectModel) {
        next = current.filter((x) => {
          console.log("=========x========");
          console.log(x);
          console.log("=========x========");
          if (!x || typeof x !== "object") return true;

          console.log("=========removeId========");
          console.log(removeId);
          console.log("=========removeId========");

          // 判断是否需要用id删除 （如果removeId不为空且循环的数组中的id不为空）
          const hasIdToCompare = removeId != null && x.id != null;

          console.log("=========hasIdToCompare========");
          console.log(hasIdToCompare);
          console.log("=========hasIdToCompare========");

          // 如果需要用id删除，则判断id是否相等，不相等则保留，相等则删除
          if (hasIdToCompare) return x.id !== removeId;

          const url = x.path || x.url; // 兼容字段名 path/url
          // 如果不需要用id删除，则判断url是否相等，不相等则保留，相等则删除
          console.log("=========url========");
          console.log(url);
          console.log("=========url========");
          console.log("=========removeUrl========");
          console.log(removeUrl);
          console.log("=========removeUrl========");
          return url !== removeUrl;
        });
      } else {
        next = current.filter((u) => u !== removeUrl);
      }

      this.$emit("update:poster_urls", next);

      this.$emit("remove", { id: removeId, path: removeUrl });
    },
  },
};
</script>

<style scoped>
.upload-images-wrap {
  width: 100%;
}
.upload-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}
</style>
