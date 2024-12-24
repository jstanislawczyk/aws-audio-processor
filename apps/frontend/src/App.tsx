import {ChangeEvent, useState} from 'react'
import './App.css'

type UploadingStatus = 'uploading' | 'done' | 'error';

function App() {
  const apiURL = 'http://localhost:8000/api/upload/';  // REPLACE WITH YOUR API GW URL
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadingStatus, setUploadingStatus] = useState<UploadingStatus | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage('Please select a file');
      return;
    }

    setUploadingStatus('uploading');

    const presignedURLResult = await fetch(apiURL, {
        method: 'POST',
        body: JSON.stringify({ fileName: file?.name }),
      })
      .then(response => response.json())
      .catch(error => setErrorMessage(error.message));

    if (!presignedURLResult.url) {
      setErrorMessage('Failed to get a pre-signed URL');
      return;
    }

    await fetch(presignedURLResult.url, {
        method: 'PUT',
        body: file,
      })
      .catch(error => setErrorMessage(error.message));

    setUploadingStatus('done');
    setFile(null);
  };

  return (
    <div>
      {file ? (
        <section className="file-details">
          <h2>File details</h2>
          <ul>
            <li>Name: {file.name}</li>
            <li>Type: {file.type}</li>
            <li>Size: {file.size.toLocaleString()} bytes</li>
          </ul>
          <button onClick={handleUpload}>Upload a file</button>
        </section>
      ) : (
        <div>
          <h1>Upload audio file</h1>
          <input type="file" accept="audio/*,.mp3" onChange={handleFileChange}/>
        </div>
      )}

      {uploadingStatus === 'uploading' && <p>Uploading...</p>}
      {uploadingStatus === 'done' && <p className="file-upload-success">File successfully uploaded</p>}
      {errorMessage && <p className="file-upload-error">{errorMessage}</p>}
    </div>
  )
}

export default App
