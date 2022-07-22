import React, { Component } from 'react';
// import logo from '../src/logo.svg';
import '../src/App.css';
class App extends Component {
  constructor(props) {

    // Calling super class constructor
    super(props);
    this.state = {
      files: [],
      file: ''
    }
       // Binding event handler
    this.loadFiles = this.loadFiles.bind(this);
  }
  componentDidMount() {

    setTimeout(() => {
      this.loadFiles();
    }, 1000)
    // this.loadFiles();
  }
  loadFiles() {
    fetch('/files',{
      method:'GET'
     
    })
      .then(res => res.json())
      .then(files => {
        if (files.message) {
          console.log('No Files');
          this.setState({ files: [] })
        } else {
          this.setState({ files })
        }
      });
  }
 fileChanged(event) {
   const f = event.target.files[0];
   this.setState({
     file: f
   });
 }

 uploadFile(event) {
    event.preventDefault();
    let data = new FormData();
    data.append('file', this.state.file);
   fetch('/files', {
     method: 'POST',
     body: data
   }).then(res => res.json())
     .then(data => {
       if (data.success) {
        this.loadFiles();
        alert('Success')
     } else {
       alert('Upload failed');
     }
   });
 }
render() {
    const { files } = this.state;
    return (
      <div className="App">
        <header className="App-header">
          {/* <img src={logo} className="App-logo" alt="logo" /> */}
          <h1 className="App-title">File_Upload </h1>
        </header>
        <div className="App-content">
          <input type="file" onChange={this.fileChanged.bind(this)}/>
          <button onClick={this.uploadFile.bind(this)}>Upload</button>
          <table className="App-table">
            <thead>
              <tr>
                  <th>Download</th>
                  <th>Uploaded</th>
                  <th>Size</th>
                  
              </tr>
            </thead>
            <tbody>
              {files.map((file, index) => {
                console.log(index)
                var d = new Date(file.uploadDate);
                return (
                  <tr key={index}>
                    <td><a href={`http://localhost:3600/files/${file.filename}`}>{file.filename}</a></td>
                    <td>{`${d.toLocaleDateString()} ${d.toLocaleTimeString()}`}</td>
                    <td>{(Math.round(file.length/100) / 10)+'KB'}</td>
                    
                   
                    
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
export default App;