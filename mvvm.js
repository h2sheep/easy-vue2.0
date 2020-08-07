
// -------- MVVM -----------

class MVVM {
	constructor(options) {
		this.$el = options.el
		this.$data = options.data
		this.$options = options
    
		if (this.$el) {
      // 监听属性
      new Observer(this.$data)
      
      // 模板编译
      new Compile(this.$el, this)
      
      // 数据代理
      this.proxy(this.$data)
    }
	}
  
  
  proxy(data) {
    for (const key in data) {
      // 为vm定义data中属性
      Object.defineProperty(this, key, {
        enumerable: true,
        configurable: false,
        
        // 读取时直接返回data中对应属性的值
        get() {
          return data[key]
        },
        
        // 修改时直接修改data中对应属性的值
        set(newVal) {
          data[key] = newVal
        }
      })
    }
  }
}