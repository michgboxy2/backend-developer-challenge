import React, { Component } from "react";
import Dropzone from "../dropzone/Dropzone";
import "./Upload.css";
import Progress from "../progress/Progress";
import { CSVLink } from "react-csv";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

class Upload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      files: {},
      uploading: false,
      uploadProgress: {},
      successfullUploaded: false,
      disbursementRecords: [],
      csvAvailable: false,
      currencyList: [],
      currency: ""
    };

    this.exportCSV = this.exportCSV.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onFilesAdded = this.onFilesAdded.bind(this);
    this.uploadFiles = this.uploadFiles.bind(this);
    this.sendRequest = this.sendRequest.bind(this);
    this.renderActions = this.renderActions.bind(this);
  }

  componentDidMount(){
    this.getCurrencies();
  }

  onFilesAdded(files) {
    this.setState({ files });
  }

  onChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  async uploadFiles() {
    this.setState({ uploadProgress: {}, uploading: true });
    this.sendRequest(this.state.files);
    try {
      this.setState({ successfullUploaded: true, uploading: false });
    } catch (e) {
      this.setState({ successfullUploaded: true, uploading: false });
      toast.error(e);
    }
  }

  async sendRequest(file) {
      const {currency} = this.state;
      if(!currency){
        toast.error('kindly select a base currency from the drop down');
        return null;
    }
    const formData = new FormData();
    formData.append("file", file[0], file.name);
    formData.append("baseCurrency", currency);

    fetch("http://127.0.0.1:3000/api/v1/disburse", {
      method: "POST",
      body: formData
    })
      .then(response => response.json())
      .then(data =>
        this.setState({ disbursementRecords: data, csvAvailable: true })
      )
      .catch(e => {toast.error(e)});
  }

  renderProgress(file) {
    const uploadProgress = this.state.uploadProgress[file.name];
    if (this.state.uploading || this.state.successfullUploaded) {
      return (
        <div className="ProgressWrapper">
          <Progress progress={uploadProgress ? uploadProgress.percentage : 0} />
          <img
            className="CheckIcon"
            alt="done"
            src="baseline-check_circle_outline-24px.svg"
            style={{
              opacity:
                uploadProgress && uploadProgress.state === "done" ? 0.5 : 0
            }}
          />
        </div>
      );
    }
  }

  exportCSV() {
    const headers = [
      { label: "Nonprofit", Key: "Nonprofit" },
      { label: `Total amount ${this.state.currency}`, Key: `Total amount ${this.state.currency}` },
      { label: "Total Fee", Key: "Total Fee" },
      { label: "Number of Donations", Key: "Number of Donations" }
    ];
  }

  renderActions() {
    if (this.state.files.length > 1) {
      toast.error("Only one file is allowed for download");
    }

    if (this.state.files.length === 1) {
      if (this.state.successfullUploaded) {
        return (
          <button onClick={() => this.setState({ successfullUploaded: false })}>
            Clear
          </button>
        );
      } else {
        return <button onClick={this.uploadFiles}>Upload</button>;
      }
    }
  }

  getCurrencies = async () => {
      fetch("http://127.0.0.1:3000/api/v1/disburse")
      .then(response => response.json())
      .then(currency => {
        this.setState({ currencyList: currency });
      })
      .catch(e =>{
      toast.error(e);
      })
   
  };

  renderDownloadCsvButton = () => {
    if (this.state.csvAvailable) {
      return (
        <CSVLink data={this.state.disbursementRecords}>
          <button>Download CSV</button>
        </CSVLink>
      );
    }
  };

  render() {
    const { csvAvailable, currency } = this.state;
    let i;
    if (csvAvailable) {
      toast.success("click the download button to download csv file");
    }
    return (
      <div className="Upload">
        <span className="Title">click to Upload Files</span>
        <div className="Content">
          <div className="row">
            <Dropzone
              onFilesAdded={this.onFilesAdded}
              disabled={this.state.uploading || this.state.successfullUploaded}
            />

            <div className="col-md-5">
              <div className="input-group mb-1">
                <select
                  className="custom-select"
                  name="currency"
                  value={this.state.currency}
                  onChange={this.onChange}
                >
                  <option defaultValue>Select currency</option>
                  {this.state.currencyList.map((currency, i) => {
                      i++;
                      return <option key={i} value={currency}>{currency}</option>
                  })}
                  
                </select>
              </div>
            </div>
          </div>
          <div className="Files">
            <div className="Row">
              <span className="Filename">{this.state.files.name}</span>
              {this.renderProgress(this.state.files)}
            </div>
          </div>
        </div>
        <div className="Actions">{this.renderActions()}</div>
        {this.renderDownloadCsvButton()}
        <ToastContainer />
      </div>
    );
  }
}

export default Upload;
