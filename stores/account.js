import { defineStore } from 'pinia'

export const useAccountStore = defineStore('account', {
  state: () => {
    // 从本地存储加载数据
    const savedAccounts = uni.getStorageSync('accounts') || []
    const savedCategories = uni.getStorageSync('categories') || [
      { id: 1, name: '餐饮', icon: '🍚', color: '#FF9800' },
      { id: 2, name: '交通', icon: '🚗', color: '#2196F3' },
      { id: 3, name: '购物', icon: '🛒', color: '#E91E63' },
      { id: 4, name: '娱乐', icon: '🎮', color: '#9C27B0' },
      { id: 5, name: '居家', icon: '🏠', color: '#4CAF50' }
    ]

    return {
      accounts: savedAccounts,
      categories: savedCategories,
      budget: uni.getStorageSync('budget') || 0, // 添加预算
      tags: uni.getStorageSync('tags') || [] // 添加标签功能
    }
  },
  
  actions: {
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
      if (!this.tags.includes(tag)) {
        this.tags.push(tag)
        this.saveTags()
      }
    },
    
    // 删除标签
    deleteTag(tag) {
      const index = this.tags.indexOf(tag)
      if (index !== -1) {
        this.tags.splice(index, 1)
        this.saveTags()
        // 同时删除所有账单中的这个标签
        this.accounts.forEach(account => {
          const tagIndex = account.tags.indexOf(tag)
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
    }
  }
}) 