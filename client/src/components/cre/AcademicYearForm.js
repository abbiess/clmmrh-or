import React, { Component } from "react";
import { connect } from "react-redux";
import TextFieldGroup from "../../commons/TextFieldGroup";
import axios from "axios";
import isEmpty from "../../validation/is-empty";
import MessageBoxInfo from "../../commons/MessageBoxInfo";
import Searchbar from "../../commons/Searchbar";
import "../../styles/Autosuggest.css";

import { Layout, Breadcrumb, Form, Table, Icon, message } from "antd";

import { formItemLayout, tailFormItemLayout } from "./../../utils/Layouts";

const { Content } = Layout;

const collection_name = "research_categories";

const form_data = {
  [collection_name]: [],
  _id: "",
  desc: "",
  errors: {}
};

class AcademicYearForm extends Component {
  state = {
    title: "Academic Years",
    url: "/api/academic-years/",
    search_keyword: "",
    ...form_data
  };

  onChange = e => {
    this.setState({ [e.target.name]: e.target.value });
  };

  onSubmit = e => {
    e.preventDefault();

    const form_data = {
      ...this.state,
      user: this.props.auth.user
    };

    if (isEmpty(this.state._id)) {
      axios
        .put(this.state.url, form_data)
        .then(({ data }) => {
          message.success("Transaction Saved");
          this.setState({
            ...data,
            errors: {},
            message: "Transaction Saved"
          });
        })
        .catch(err => {
          message.error("You have an invalid input");
          this.setState({ errors: err.response.data });
        });
    } else {
      axios
        .post(this.state.url + this.state._id, form_data)
        .then(({ data }) => {
          message.success("Transaction Updated");
          this.setState({
            ...data,
            errors: {},
            message: "Transaction Updated"
          });
        })
        .catch(err => this.setState({ errors: err.response.data }));
    }
  };

  onSearch = (value, e) => {
    e.preventDefault();

    axios
      .get(this.state.url + "?s=" + this.state.search_keyword)
      .then(response =>
        this.setState({
          [collection_name]: response.data,
          message: isEmpty(response.data) ? "No rows found" : ""
        })
      )
      .catch(err => console.log(err));
  };

  addNew = () => {
    this.setState({
      ...form_data,
      errors: {},
      message: ""
    });
  };

  edit = record => {
    axios
      .get(this.state.url + record._id)
      .then(response => {
        const record = response.data;
        this.setState(prevState => {
          return {
            ...form_data,
            [collection_name]: [],
            ...record,
            errors: {}
          };
        });
      })
      .catch(err => console.log(err));
  };

  onDelete = () => {
    axios
      .delete(this.state.url + this.state._id)
      .then(response => {
        message.success("Transaction Deleted");
        this.setState({
          ...form_data,
          message: "Transaction Deleted"
        });
      })
      .catch(err => {
        message.error(err.response.data.message);
      });
  };

  onHide = () => {
    this.setState({ message: "" });
  };

  render() {
    const records_column = [
      {
        title: "Description",
        dataIndex: "desc"
      },
      {
        title: "",
        key: "action",
        width: 10,
        render: (text, record) => (
          <span>
            <Icon
              type="edit"
              theme="filled"
              className="pointer"
              onClick={() => this.edit(record)}
            />
          </span>
        )
      }
    ];

    const { errors } = this.state;

    return (
      <Content style={{ padding: "0 50px" }}>
        <div className="columns is-marginless">
          <div className="column">
            <Breadcrumb style={{ margin: "16px 0" }}>
              <Breadcrumb.Item>Home</Breadcrumb.Item>
              <Breadcrumb.Item>Acadmic Years</Breadcrumb.Item>
            </Breadcrumb>
          </div>
          <div className="column">
            <Searchbar
              name="search_keyword"
              onSearch={this.onSearch}
              onChange={this.onChange}
              value={this.state.search_keyword}
              onNew={this.addNew}
            />
          </div>
        </div>

        <div style={{ background: "#fff", padding: 24, minHeight: 280 }}>
          <span className="is-size-5">{this.state.title}</span> <hr />
          <MessageBoxInfo message={this.state.message} onHide={this.onHide} />
          {isEmpty(this.state[collection_name]) ? (
            <Form onSubmit={this.onSubmit}>
              <TextFieldGroup
                label="Description"
                name="desc"
                value={this.state.desc}
                error={errors.desc}
                formItemLayout={formItemLayout}
                onChange={this.onChange}
              />

              <Form.Item className="m-t-1" {...tailFormItemLayout}>
                <div className="field is-grouped">
                  <div className="control">
                    <button className="button is-small is-primary">Save</button>
                  </div>
                  {!isEmpty(this.state._id) ? (
                    <a
                      className="button is-danger is-outlined is-small"
                      onClick={this.onDelete}
                    >
                      <span>Delete</span>
                      <span className="icon is-small">
                        <i className="fas fa-times" />
                      </span>
                    </a>
                  ) : null}
                </div>
              </Form.Item>
            </Form>
          ) : (
            <Table
              dataSource={this.state[collection_name]}
              columns={records_column}
              rowKey={record => record._id}
            />
          )}
        </div>
      </Content>
    );
  }
}

const mapToState = state => {
  return {
    auth: state.auth
  };
};

export default connect(mapToState)(AcademicYearForm);
