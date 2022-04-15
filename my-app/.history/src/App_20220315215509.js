// import * as React from 'react'
// import * as ReactDOM from 'react-dom'

import './App.less';
import { Input } from 'antd';
import { Button } from 'antd';
import { Card } from 'antd';


import 'antd/dist/antd.css'; // or 'antd/dist/antd.less'
import React from 'react';

class Memos extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      memos: ''
    }
  }

  render() {
    console.log('Memos Render:');
    console.log(this.props);
    const data = this.props.data
    console.log(data);

    let listItems = ''

    if (data.data !== undefined) {
      console.log(data.data);
      console.log(data.data.length);
      listItems = data.data.map((item, index) =>
        <Card key={index} title={item.sim.toFixed(2)} size="small" extra={<a target='_blank' href={"https://flomoapp.com/mine/?memo_id=" + item.slug} >详情</a>} style={{ width: 300 }}>
          <div dangerouslySetInnerHTML={{ __html: item.content }}>
          </div>
          {/* <Meta description="This is the description" /> */}
        </Card>
      )
    }

    return (
      <div className='memos'>
        {listItems}
      </div>
    )
  }
}

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      input_value: '',
      local_input_value: '',
      memos: '',
      data: [],
      isLoading: true
    }
  }

  // keyword: HTMLInputElement
  // 搜索文本框
  // keywordRef = (element: HTMLInputElement) => {
  //   if (element) {
  //     element.value = ''
  //     element.focus()
  //   }
  //   this.keyword = element
  // }

  componentDidMount = () => {
    console.log('componentDidMount');
    let storage=window.localStorage;
    let local_input_value = storage['local_input_value']
    console.log(local_input_value);

    this.setState({
      input_value:local_input_value
    })
  }

  onInputEnter = (e) => {
    console.log('onInputEnter:');
    console.log(e.nativeEvent);
    let cmd_key = e.nativeEvent.metaKey || e.nativeEvent.ctrlKey
    console.log('cmd_key:');
    console.log(cmd_key);
    // 监听回车键
    if (e.nativeEvent.keyCode === 13 && cmd_key) {
      console.log('寻找线索');
      this.handleBtnClick()
    }
  }

  // 按钮点击
  handleBtnClick = (e) => {
    console.log('click');
    console.log(this.state.input_value);

    fetch('http://192.168.3.12:8888?keyword=' + this.state.input_value)
      .then((response) => response.json())
      .then((json) => {
        // console.log(json);
        this.setState({ data: json });
      })
      .catch((error) => console.error(error))
      .finally(() => {
        this.setState({ isLoading: false });
      });
  }

  // 文本框值变化时
  onInputChange = (e) => {
    console.log(e.nativeEvent.path[0].value);
    this.setState({
      input_value: e.nativeEvent.path[0].value
    })

    // 将输入值保存到本地
    let storage = window.localStorage;
    storage['local_input_value'] = e.nativeEvent.path[0].value

  }

  render() {
    const { TextArea } = Input;
    return (
      <div className="App">
        <div className='my-form'>
          <div>
            <TextArea defaultValue={window.localStorage['local_input_value']} id='memo-input' onKeyDown={this.onInputEnter} onInput={this.onInputChange} rows={4} />
            <Button id='find-button' onClick={this.handleBtnClick.bind()} type="primary" block>
              寻找线索
            </Button>
          </div>
        </div>

        <Memos data={this.state.data} />
      </div>
    );
  }
}

export default App;
