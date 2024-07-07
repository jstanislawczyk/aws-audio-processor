import {ChangeEvent, useState} from 'react'
import './App.css'

function App() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    console.log(file)
  };

  return (
    <>
      <div>
        <h1>Upload audio file</h1>
        <input type="file" accept="audio/*,.mp3" onChange={handleFileChange} />
      </div>

      {file && (
        <section className="file-details">
          <h2>File details</h2>
          <ul>
            <li>Name: {file.name}</li>
            <li>Type: {file.type}</li>
            <li>Size: {file.size} bytes</li>
          </ul>
        </section>
      )}

      {file && <button onClick={handleUpload}>Upload a file</button>}
    </>
  )
}

export default App
