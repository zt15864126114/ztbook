import { defineStore } from 'pinia'

export const useAccountStore = defineStore('account', {
  state: () => ({
    accounts: [],  // 改为空数组而不是 null
    categories: [
      { id: 1, name: '餐饮', icon: '🍚', color: '#FF9800', isDefault: true },
      { id: 2, name: '交通', icon: '🚌', color: '#2196F3', isDefault: true },
      { id: 3, name: '购物', icon: '🛍️', color: '#E91E63', isDefault: true },
      { id: 4, name: '娱乐', icon: '🎮', color: '#9C27B0', isDefault: true },
      { id: 5, name: '居住', icon: '🏠', color: '#4CAF50', isDefault: true },
      { id: 6, name: '其他', icon: '📝', color: '#607D8B', isDefault: true }
    ],
    budget: 0,
    currency: 'CNY',
    listAnimation: uni.getStorageSync('listAnimation') ?? true,
    thousandsSeparator: false,
    hideAmount: uni.getStorageSync('hideAmount') ?? false,
    tags: [],  // 添加 tags 状态
    categoryStats: {}, // 添加分类统计缓存
    monthlyStats: {}   // 添加月度统计缓存
  }),
  
  actions: {
    initAccounts() {
      this.loadAccounts()
      this.loadCategories()
      this.loadBudget()
      this.loadCurrency()
      this.loadThousandsSeparator()
      this.loadTags()
    },
    
    // 从本地存储加载账单数据
    loadAccounts() {
      const savedAccounts = uni.getStorageSync('accounts')
      if (savedAccounts) {
        this.accounts = savedAccounts
      }
    },
    
    addAccount(account) {
      // 添加标签功能
      if (account.tags && !Array.isArray(account.tags)) {
        account.tags = [account.tags]
      }
      
      const newAccount = {
        id: Date.now(),
        ...account,
        createTime: new Date(),
        tags: account.tags || []
      }
      
      this.accounts.push(newAccount)
      this.saveAccounts()
      // 触发更新
      this.refresh()
    },
    
    updateAccount(id, updates) {
      const index = this.accounts.findIndex(item => item.id === id)
      if (index !== -1) {
        this.accounts[index] = {
          ...this.accounts[index],
          ...updates,
          updateTime: new Date()
        }
        this.saveAccounts()
      }
    },
    
    deleteAccount(id) {
      const index = this.accounts.findIndex(item => item.id === id)
      if (index !== -1) {
        this.accounts.splice(index, 1)
        this.saveAccounts()
      }
    },
    
    // 添加标签
    addTag(tag) {
      if (!this.tags?.includes(tag)) {
        if (!this.tags) this.tags = []
        this.tags.push(tag)
        this.saveTags()
      }
    },
    
    // 删除标签
    deleteTag(tag) {
      if (!this.tags) return
      const index = this.tags.indexOf(tag)
      if (index !== -1) {
        this.tags.splice(index, 1)
        this.saveTags()
        // 同时删除所有账单中的这个标签
        this.accounts.forEach(account => {
          const tagIndex = account.tags?.indexOf(tag)
          if (tagIndex !== -1) {
            account.tags.splice(tagIndex, 1)
          }
        })
        this.saveAccounts()
      }
    },
    
    // 设置预算
    setBudget(amount) {
      this.budget = Number(amount)
      uni.setStorageSync('budget', this.budget)
    },
    
    // 保存数据到本地存储
    saveAccounts() {
      uni.setStorageSync('accounts', this.accounts)
    },
    
    saveCategories() {
      uni.setStorageSync('categories', this.categories)
    },
    
    saveTags() {
      uni.setStorageSync('tags', this.tags)
    },

    // 添加编辑账单方法
    editAccount(id, updates) {
      const index = this.accounts.findIndex(item => item.id === id)
      if (index !== -1) {
        this.accounts[index] = {
          ...this.accounts[index],
          ...updates,
          updateTime: new Date()
        }
        this.saveAccounts()
      }
    },

    // 添加批量删除方法
    deleteAccounts(ids) {
      this.accounts = this.accounts.filter(item => !ids.includes(item.id))
      this.saveAccounts()
    },

    // 刷新方法
    refresh() {
      this.loadAccounts()
      this.loadCategories()
      this.loadTags()
    },

    addCategory(category) {
      this.categories.push(category)
      this.saveCategories()
    },

    updateCategory(id, updatedCategory) {
      const index = this.categories.findIndex(c => c.id === id)
      if (index !== -1) {
        this.categories[index] = updatedCategory
        this.saveCategories()
      }
    },

    deleteCategory(id) {
      const index = this.categories.findIndex(c => c.id === id)
      if (index !== -1) {
        this.categories.splice(index, 1)
        this.saveCategories()
      }
    },

    setCurrency(currency) {
      this.currency = currency
      uni.setStorageSync('currency', currency)
    },

    setListAnimation(enabled) {
      this.listAnimation = enabled
      uni.setStorageSync('listAnimation', enabled)
    },

    setThousandsSeparator(enabled) {
      this.thousandsSeparator = enabled
      uni.setStorageSync('thousandsSeparator', enabled)
    },

    setHideAmount(enabled) {
      this.hideAmount = enabled
      uni.setStorageSync('hideAmount', enabled)
    },

    // 修改格式化金额的方法，添加脱敏处理
    formatAmount(amount) {
      if (!amount) return '0.00'
      const num = Number(amount).toFixed(2)
      
      // 如果启用了金额脱敏
      if (this.hideAmount) {
        return '****'
      }
      
      // 如果启用了千分位
      if (this.thousandsSeparator) {
        const parts = num.split('.')
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        return parts.join('.')
      }
      
      return num
    },

    // 从本地存储加载分类
    loadCategories() {
      const savedCategories = uni.getStorageSync('categories')
      if (savedCategories) {
        this.categories = savedCategories
      }
    },

    // 从本地存储加载金额
    loadBudget() {
      const savedBudget = uni.getStorageSync('budget')
      if (savedBudget) {
        this.budget = Number(savedBudget)
      }
    },

    // 从本地存储加载货币
    loadCurrency() {
      const savedCurrency = uni.getStorageSync('currency')
      if (savedCurrency) {
        this.currency = savedCurrency
      }
    },

    // 从本地存储加载千分位
    loadThousandsSeparator() {
      const savedThousandsSeparator = uni.getStorageSync('thousandsSeparator')
      if (savedThousandsSeparator !== null) {
        this.thousandsSeparator = savedThousandsSeparator
      }
    },

    // 从本地存储加载标签
    loadTags() {
      const savedTags = uni.getStorageSync('tags')
      if (savedTags) {
        this.tags = savedTags
      }
    },

    // 优化统计计算，避免重复计算
    updateStats() {
      // 更新分类统计缓存
      this.categoryStats = this.computeCategoryStats()
      // 更新月度统计缓存
      this.monthlyStats = this.computeMonthlyStats()
    }
  },
  
  getters: {
    // 获取当月支出
    currentMonthExpense: (state) => {
      const now = new Date()
      return state.accounts
        .filter(item => {
          const itemDate = new Date(item.createTime)
          return itemDate.getMonth() === now.getMonth() &&
                 itemDate.getFullYear() === now.getFullYear()
        })
        .reduce((total, item) => total + Number(item.amount), 0)
    },
    
    // 计算预算使用情况
    budgetUsage: (state) => {
      if (!state.budget) return 0
      return Math.min((state.currentMonthExpense / state.budget) * 100, 100)
    },
    
    // 按标签分组的支出
    expenseByTags: (state) => {
      const result = {}
      state.accounts.forEach(account => {
        account.tags.forEach(tag => {
          if (!result[tag]) {
            result[tag] = 0
          }
          result[tag] += Number(account.amount)
        })
      })
      return result
    },

    currencySymbol: (state) => {
      const symbols = {
        CNY: '¥',
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥'
      }
      return symbols[state.currency] || '¥'
    },

    // 格式化后的预算
    formattedBudget: (state) => {
      if (!state.budget) return '0.00'
      return state.thousandsSeparator 
        ? Number(state.budget).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        : Number(state.budget).toFixed(2)
    }
  }
}) 