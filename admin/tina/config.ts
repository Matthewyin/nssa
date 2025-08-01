import { defineConfig } from 'tinacms';

// 分支配置
const branch = process.env.NEXT_PUBLIC_TINA_BRANCH || process.env.GITHUB_BRANCH || 'main';

// 内容路径配置 - 指向NSSA主项目的content目录
const contentPath = '../content';

export default defineConfig({
  branch,

  // 客户端ID（用于Tina Cloud，本地开发可选）
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,

  // Token（用于Tina Cloud，本地开发可选）
  token: process.env.TINA_TOKEN,

  // 构建配置
  build: {
    outputFolder: 'admin',
    publicFolder: '../static', // 指向NSSA主项目的static目录
  },

  // 媒体配置
  media: {
    tina: {
      mediaRoot: '',
      publicFolder: '../static', // 指向NSSA主项目的static目录
    },
  },

  // 内容集合定义
  schema: {
    collections: [
      // 技术专题文章
      {
        name: 'tech',
        label: '技术专题',
        path: `${contentPath}/tech`,
        format: 'md',
        match: {
          include: '*.md',
          exclude: '_index.md',
        },
        defaultItem: () => ({
          title: '新文章',
          description: '',
          date: new Date().toISOString(),
          tags: [],
          categories: [],
          publish: {
            website: true,
            wechat_a: false,
            wechat_b: false,
          },
        }),
        fields: [
          // 基本信息
          {
            type: 'string',
            name: 'title',
            label: '标题',
            isTitle: true,
            required: true,
            description: '文章标题，建议20-50字',
          },
          {
            type: 'string',
            name: 'subtitle',
            label: '副标题',
            description: '可选的副标题，用于补充说明',
          },
          {
            type: 'string',
            name: 'description',
            label: '描述',
            required: true,
            ui: {
              component: 'textarea',
            },
            description: '文章摘要，用于SEO和社交分享',
          },
          {
            type: 'datetime',
            name: 'date',
            label: '发布日期',
            required: true,
            ui: {
              dateFormat: 'YYYY-MM-DD',
              timeFormat: 'HH:mm:ss',
            },
          },
          {
            type: 'string',
            name: 'readingTime',
            label: '阅读时间',
            description: '预估阅读时长，如"约15分钟"',
          },

          // 分类和标签
          {
            type: 'string',
            name: 'categories',
            label: '分类',
            list: true,
            options: [
              { value: '技术专题', label: '技术专题' },
              { value: '历史专题', label: '历史专题' },
              { value: '心理专题', label: '心理专题' },
              { value: '职场专题', label: '职场专题' },
            ],
            ui: {
              component: 'select',
            },
          },
          {
            type: 'string',
            name: 'tags',
            label: '标签',
            list: true,
            description: '文章标签，用于分类和检索',
          },

          // 发布配置
          {
            type: 'object',
            name: 'publish',
            label: '发布配置',
            fields: [
              {
                type: 'boolean',
                name: 'website',
                label: '发布到网站',
                description: '是否发布到nssa.io主站',
              },
              {
                type: 'boolean',
                name: 'wechat_a',
                label: '发布到微信公众号A',
                description: '是否发布到技术类公众号',
              },
              {
                type: 'boolean',
                name: 'wechat_b',
                label: '发布到微信公众号B',
                description: '是否发布到其他主题公众号',
              },
              {
                type: 'datetime',
                name: 'schedule',
                label: '定时发布',
                description: '可选的定时发布时间',
                ui: {
                  dateFormat: 'YYYY-MM-DD',
                  timeFormat: 'HH:mm:ss',
                },
              },
            ],
          },

          // 微信专用配置
          {
            type: 'object',
            name: 'wechat',
            label: '微信配置',
            fields: [
              {
                type: 'string',
                name: 'title',
                label: '微信标题',
                description: '微信公众号文章标题（可与网站标题不同）',
              },
              {
                type: 'string',
                name: 'summary',
                label: '文章摘要',
                ui: {
                  component: 'textarea',
                },
                description: '微信公众号文章摘要',
              },
              {
                type: 'string',
                name: 'author',
                label: '作者署名',
                description: '文章作者信息',
              },
              {
                type: 'image',
                name: 'cover_image',
                label: '封面图片',
                description: '微信公众号封面图，建议尺寸900x500px',
              },
              {
                type: 'string',
                name: 'tags',
                label: '微信标签',
                list: true,
                description: '微信专用标签',
              },
            ],
          },

          // 文章内容
          {
            type: 'rich-text',
            name: 'body',
            label: '文章内容',
            isBody: true,
            templates: [
              // 代码块模板
              {
                name: 'CodeBlock',
                label: '代码块',
                fields: [
                  {
                    type: 'string',
                    name: 'language',
                    label: '编程语言',
                    options: [
                      'javascript',
                      'typescript',
                      'python',
                      'bash',
                      'json',
                      'yaml',
                      'markdown',
                      'html',
                      'css',
                    ],
                  },
                  {
                    type: 'string',
                    name: 'code',
                    label: '代码内容',
                    ui: {
                      component: 'textarea',
                    },
                  },
                ],
              },
              // 引用块模板
              {
                name: 'Quote',
                label: '引用',
                fields: [
                  {
                    type: 'string',
                    name: 'text',
                    label: '引用内容',
                    ui: {
                      component: 'textarea',
                    },
                  },
                  {
                    type: 'string',
                    name: 'author',
                    label: '引用来源',
                  },
                ],
              },
              // 提示框模板
              {
                name: 'Alert',
                label: '提示框',
                fields: [
                  {
                    type: 'string',
                    name: 'type',
                    label: '类型',
                    options: ['info', 'warning', 'error', 'success'],
                  },
                  {
                    type: 'string',
                    name: 'title',
                    label: '标题',
                  },
                  {
                    type: 'string',
                    name: 'content',
                    label: '内容',
                    ui: {
                      component: 'textarea',
                    },
                  },
                ],
              },
            ],
          },
        ],
        ui: {
          // 自定义文件名生成
          filename: {
            readonly: false,
            slugify: (values) => {
              // 使用简单的slug生成，基于标题
              const slug = values?.title
                ?.toLowerCase()
                .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
                .replace(/^-+|-+$/g, '');
              return slug || 'untitled';
            },
          },
        },
      },

      // 历史专题文章
      {
        name: 'history',
        label: '历史专题',
        path: `${contentPath}/history`,
        format: 'md',
        match: {
          include: '*.md',
          exclude: '_index.md',
        },
        defaultItem: () => ({
          title: '新历史文章',
          description: '',
          date: new Date().toISOString(),
          tags: [],
          categories: ['历史专题'],
        }),
        fields: [
          {
            type: 'string',
            name: 'title',
            label: '标题',
            isTitle: true,
            required: true,
          },
          {
            type: 'string',
            name: 'description',
            label: '描述',
            required: true,
            ui: {
              component: 'textarea',
            },
          },
          {
            type: 'datetime',
            name: 'date',
            label: '发布日期',
            required: true,
          },
          {
            type: 'string',
            name: 'tags',
            label: '标签',
            list: true,
          },
          {
            type: 'string',
            name: 'categories',
            label: '分类',
            list: true,
            options: ['历史专题'],
          },
          {
            type: 'rich-text',
            name: 'body',
            label: '文章内容',
            isBody: true,
          },
        ],
      },

      // 心理专题文章
      {
        name: 'psychology',
        label: '心理专题',
        path: `${contentPath}/psychology`,
        format: 'md',
        match: {
          include: '*.md',
          exclude: '_index.md',
        },
        defaultItem: () => ({
          title: '新心理文章',
          description: '',
          date: new Date().toISOString(),
          tags: [],
          categories: ['心理专题'],
        }),
        fields: [
          {
            type: 'string',
            name: 'title',
            label: '标题',
            isTitle: true,
            required: true,
          },
          {
            type: 'string',
            name: 'description',
            label: '描述',
            required: true,
            ui: {
              component: 'textarea',
            },
          },
          {
            type: 'datetime',
            name: 'date',
            label: '发布日期',
            required: true,
          },
          {
            type: 'string',
            name: 'tags',
            label: '标签',
            list: true,
          },
          {
            type: 'string',
            name: 'categories',
            label: '分类',
            list: true,
            options: ['心理专题'],
          },
          {
            type: 'rich-text',
            name: 'body',
            label: '文章内容',
            isBody: true,
          },
        ],
      },

      // 职场专题文章
      {
        name: 'workplace',
        label: '职场专题',
        path: `${contentPath}/workplace`,
        format: 'md',
        match: {
          include: '*.md',
          exclude: '_index.md',
        },
        defaultItem: () => ({
          title: '新职场文章',
          description: '',
          date: new Date().toISOString(),
          tags: [],
          categories: ['职场专题'],
        }),
        fields: [
          {
            type: 'string',
            name: 'title',
            label: '标题',
            isTitle: true,
            required: true,
          },
          {
            type: 'string',
            name: 'description',
            label: '描述',
            required: true,
            ui: {
              component: 'textarea',
            },
          },
          {
            type: 'datetime',
            name: 'date',
            label: '发布日期',
            required: true,
          },
          {
            type: 'string',
            name: 'tags',
            label: '标签',
            list: true,
          },
          {
            type: 'string',
            name: 'categories',
            label: '分类',
            list: true,
            options: ['职场专题'],
          },
          {
            type: 'rich-text',
            name: 'body',
            label: '文章内容',
            isBody: true,
          },
        ],
      },

      // 页面集合（关于页面等）
      {
        name: 'page',
        label: '页面',
        path: `${contentPath}`,
        format: 'md',
        match: {
          include: '{about,_index}.md',
        },
        fields: [
          {
            type: 'string',
            name: 'title',
            label: '页面标题',
            isTitle: true,
            required: true,
          },
          {
            type: 'string',
            name: 'description',
            label: '页面描述',
            ui: {
              component: 'textarea',
            },
          },
          {
            type: 'rich-text',
            name: 'body',
            label: '页面内容',
            isBody: true,
          },
        ],
      },
    ],
  },

  // 搜索配置
  search: {
    tina: {
      indexerToken: process.env.TINA_SEARCH_TOKEN,
      stopwordLanguages: ['zh'],
    },
  },
});
