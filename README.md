# binding-form
An efficient form component, based on Mobx.

# 基础 Form 组件

基础 Form 组件，实现平台前端侧的整体表单逻辑。内部基于 mobx 和 antd Form 实现。无任何样式绑定，需要在实际项目中对样式进行自定义。

组件内样式可以通过bindingForm为前缀的class来自定义，当前bindingForm这个前缀也是可以自定义的。

<br/>

## 1. 组件结构

组件划分为 `Form`、`FieldSet`、`Field` 三个组件层级，基于Mobx的完全的双向数据绑定，具体的数据由业务开发自行管理。

每个`Form`都唯一的持有自己的 领域store (由内置 API 创建) 。

- `Form` 表示顶层表单。表单是一系列表单项的集合，其拥有同样的验证周期和上下文
- `FieldSet` 表示若干子表单项的子集，可选的抽象层次。用于统一控制该集合所有`Field`的禁用状态以及验证规则等。其提供了对表单项逻辑分组的功能
- `Field` 表示一个具体的表单项，其描述了表单项的具体行为和值变化关系等。`Field` 实现了对基础输入组件(`input`等)的透明绑定

从父子结构来说，`Form`(持有`store`) -> `FieldSet`(可选) -> `Field` -> `基础输入组件`

从数据流动来说，`store`<-->`基础输入组件`(通过`Field`透明绑定)

从开发体验来说，业务开发在 `store` 上读取和设置数据，在 `Field` 等组件上设置验证规则，即可实现对表单的控制

> 典型代码如下，以注册框为例。

```jsx
const store = createFormStore({
  username: '',
  password: '',
  password_repeat: ''
});

const form = (
  <Form
    formStore={store}
    onSubmit={onSubmit}
  >
    <h1>Register</h1>
    <FieldSet rules={[rules.require()]}>
      <Field valueKey="username" rules={[rules.account()]}><input/></Field>
      <Field valueKey="password" rules={[rules.password()]}><input type="password"/></Field>
      <Field valueKey="password_repeat" rules={[rules.password(), rules.equalsTo({target: 'password'})]}><input type="password"/></Field>
    </FieldSet>
    <button type="submit">submit</button>
  </Form>
);

function setDemoData() {
  store.username = 'test';
  store.password = '1';
  store.password_repeat = '2'; // submit 或 手动验证时会触发 equalsTo 规则错误
}

function onSubmit(validateResult) {
  validateResult.then((result) => {
    result: {
      errorList: [], // 验证得到错误结果的实例列表
      state: {} // 最终的结果，过滤过isVisible之后的结果
    }
    console.log(result);
  });
}
```

<br/>

## 2. API 定义

- `createFormStore()` 创建 form 使用的 store，其实质为 mobx 的 store 对象

  ```jsx
  createFormStore<T:Object> : (data:T) => T;
  ```

  _注意，返回值除了原始类型\<T\>外，还附加了下列方法:_

  - `getState()` 获取当前有效的数据副本，处理了 visible 等表单状态
    ```jsx
    () => Object
    ```

  - `validateFieldsAndScroll()` 验证所有 fields 并异步返回错误列表，无错误时 resolve([])

    ```jsx
    () => Promise<Array<ErrorInstance>>
    ```

    其中

      - `ValidateError` 是验证未通过时的错误结构，定义为：

        ```jsx
        {
          valueKey: string,
          validateRule: Array<{
            uniqueKey: string,
            method: () => {
              isCorrectValue: boolean,
              errorMessage?: string
            }
          }>,
          verifyThisField: () => Promise<{
            isCorrectValue: boolean,
            errorMessage?: string | React.Node
          }>,
          updateFieldState: () => void,
          ignoreDisplayError: boolean,
          isCorrectValue: boolean,
          errorMessage: string | React.Node,
          validateStatus: 'warning' | 'error' | 'success' | 'validating',
          validateErrorStatus: 'warning' | 'error'
        }
        ```

  - `resetFields()` 重置所有 fields 为初始值，初始值为调用 `createFormStore` 时的初始对象(deepClone的副本)。注意，动态添加的字段将被清除

    ```jsx
    () => void
    ```

  - `toJSON()` 返回剥离了 mobx 支持的纯数据对象副本，用于外部使用数据

    ```jsx
    () => Object
    ```

- `baseRule` 规则描述与表单项的具体验证方法。内置规则参见附录。
    使用内置或自定义规则时，直接调用即可，内部对象无需关注。
    自定义验证（包含异步验证）的使用情况保持一致的API，实例如下：
    ```jsx
      (value, store, standardStatus) => {
        if (value.length === 0) {
          return standardStatus.error('供应商多选情况下，不能为空。');
        }
        return standardStatus.success();
      }
    ```
    其中standardStatus的数据结构为：
    ```jsx
      type standardResultType = {
        warning: (errorMessage: string | React.Node) => resultType,
        error: (errorMessage: string | React.Node) => resultType,
        success: () => resultType,
        validating: () => resultType
      }
    ```
-  `storeHelper` 提供一个方法类，来帮助我们操作store。`stroeHelper.get(store, valueKey)` ; `storeHelper.set(store, valueKey, value)`

- `<Form>` 表示表单的 component

  ```jsx
  type FormPropsType = {
    /**
     * 由 createFormStore() 创建的特殊 store，不能直接使用原始 mobx store
     */
    formStore: Object,
    /**
     * 规范化的三种布局样式(Ant Form)，默认为 horizontal
     */
    layout?: 'inline' | 'vertical' | 'horizontal',
    /**
     * 是否隐藏label旁的"红*"标志，默认为 false
     */
    hideRequiredMark?: boolean,
    /**
     * submit 时的回调，与原始时间定义相同
     * 业务应自行调用 validateFieldsAndScroll() 进行表单验证
     * 若返回 promise，则自动禁用 Form 下的所有 submit 按钮
     */
    onSubmit?: (event: Event) => void | Promise,
    /**
     * Form 的内容节点，不限制类型
     */
    children: any,
  }
  ```

- `<FieldSet>` 表示一些子表单项的逻辑分组

  ```jsx
  type FieldSetPropsType = {

    /**
     * 子 Field 是否可见，默认为未设置。为子级 Field 提供默认值
     * 参见 Field 用法
     */
    visible?: boolean | (formStore) => boolean,
    /**
     * 子 Field 是否禁用，默认为未设置。为子级 Field 提供默认值
     * 参见 Field 用法
     */
    disabled?: boolean | (formStore) => boolean,

    /**
     * 验证规则，按顺序验证，在发现第一个错误时停止
     * 规则合并见 Field
     */
    rules?: Array<RuleType>,

    /**
     * 是否隐藏label旁的"红*"标志，默认为 false
     */
    hideRequiredMark?: boolean,
    /**
     * 是否显示 label 后面的冒号，默认为未设置，为子级 Field 提供默认值
     * 参加 Field 用法
     */
    colon?: boolean,
    /**
     * label 标签布局，默认为未设置，为子级 Field 提供默认值
     * 参加 Field 用法
     */
    labelCol?: {},
    /**
     * 输入控件设置布局，默认为未设置，为子级 Field 提供默认值
     * 参加 Field 用法
     */
    wrapperCol?: {},

    /**
     * 任意类型子组件，无限制
     */
    children: any,

  }
  ```

- `<Field>` 描述一个表单项，透明的对内部输入组件进行值的双向绑定

  ```jsx
  type FieldPropsType = {

    /**
     * 值与 store 的双向绑定字段，支持复杂表达式
     * 如 valueKey 为 'foo'，则绑定到 store['foo']
     * 如 valueKey 为 'foo.0.bar'，则绑定到 store['foo'][0]['bar']'。具体语法见 https://www.npmjs.com/package/nested-property
     */
    valueKey: string,

    /**
     * 从内部输入组件获取值的时机，默认为 'onChange'
     */
    trigger?: string,
    /**
     * 内部输入组件值验证的时机，默认为 'onBlur'
     */
    validateTrigger?: string,
    /**
     * 内部输入组件的值字段，默认为 'value'。对于自定义的特殊组件，需提供值
     * 内部已对 antd 的基础库组件做了兼容，无需传递，如 <Switch> 组件的 'checked'
     */
    valuePropName?: string,
    /**
     * 在 onChange 等事件上获取新值的读取方法，已提供默认实现。对于自定义的特殊组件，需提供值
     * 内部已对 antd 的基础库组件做了兼容，无需传递，如 TODO
     * tip. 可以劫持默认获取组件值的时机方法内拿到的值，并转换成自己想要的格式
     */
    getValueFromEvent?: (Object) => any,

    /**
     * 验证规则，按顺序验证，在发现第一个错误时停止
     * 若 父级 FieldSet 指定的，需将 FieldSet 的 rules 合并至 Field
     * 合并时，当二者包含相同名称规则时，使用 FieldSet 的规则顺序，Field的规则实例
     */
    rules?: Array<RuleType>,

    /**
     * 是否在已验证错误时，不展示具体的错误信息。默认为 false，总是展示错误信息
     * 仅用于特殊业务场景
     */
    ignoreDisplayError?: boolean,
    /**
     * 是否隐藏label旁的"红*"标志，默认为 false
     */
    hideRequiredMark?: boolean,
    /**
     * 是否展示校验状态图标，默认为 false
     */
    hasFeedback?: boolean,

    /**
     * label 标签的文本
     */
    label: string | React.Node,
    /**
     * 配合 label 属性使用，表示是否显示 label 后面的冒号。默认展示
     */
    colon?: boolean,

    /**
     * label 标签布局，同 <Col> 组件，设置 span offset 值，如 {span: 3, offset: 12} 或 sm: {span: 3, offset: 12}
     */
    labelCol?: {},
    /**
     * 需要为输入控件设置布局样式时，使用该属性，用法同 labelCol
     */
    wrapperCol?: {},

    /**
     * 是否此 Field 可见，默认可见。设置不可见后，不再参与验证和表单值收集(即视为不存在此 Field)
     * 若当前 Field 未设置(或为undefined)，尝试从 父级 FieldSet 上读取
     * 如果若想产生级联效果（此输入项的可见根绝另一项值来决定），请使用回调形式处理。
     */
    visible?: boolean | (formStore, valueKey) => boolean,
    /**
     * 是否禁用此 Field，禁用后不再允许用户操作(如input的禁用，依赖基础输入组件实现)，但仍进行表单验证和值收集行为(仍可通过store读取或修改)
     * 若传入回调方法，在每次值变化后计算当前禁用状态
     * 若当前 Field 未设置(或为undefined)，尝试从 父级 FieldSet 上读取
     * 若希望产生级联效果，建议使用回调形式处理。
     */
    disabled?: boolean | (formStore, valueKey) => boolean,

    /**
     * 直接子级为基础输入组件，不能再包装外围容器
     */
    children: React.Element<any>,
  }
  ```

## 3. 用例
  
    详见 From/test/index.jsx 文件示例
