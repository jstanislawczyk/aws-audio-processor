import React, {ChangeEvent, useState} from 'react'
import './App.css'
import {useMutation, useQuery} from '@tanstack/react-query';
import {type AudioJobDto} from '@audio-processor/schemas';

const baseApiURL = 'API_GW/audio-processor/api'; // REPLACE WITH YOUR API GW URL

function App() {
  return (
    <div className="audio">
      <AudioUpload />
      <UploadedFiles />
    </div>
  )
}

const AudioUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const uploadAudioFile = useMutation({
    mutationKey: ['uploadAudioFile'],
    mutationFn: async (file: File) => {
      const response = await fetch(`${baseApiURL}/upload`, {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name }),
      });

      if (!response.ok) {
        throw new Error('Failed to get a pre-signed URL');
      }

      const presignedURLResult = await response.json();

      if (!presignedURLResult.url) {
        throw new Error('Failed to get a pre-signed URL');
      }

      await fetch(presignedURLResult.url, {
        method: 'PUT',
        body: file,
      });
    },
    onSuccess: () => {
      setFile(null);
    }
  });

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

    uploadAudioFile.mutate(file);
  };

  return (
    <div className="audio-upload">
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
        <div className="file-details">
          <h1>Upload audio file</h1>
          <input type="file" accept="audio/*,.mp3" onChange={handleFileChange}/>
        </div>
      )}

      {uploadAudioFile.isPending && <p>Uploading...</p>}
      {uploadAudioFile.isSuccess && <p className="file-upload-success">File successfully uploaded</p>}
      {errorMessage && <p className="file-upload-error">{errorMessage}</p>}
    </div>
  )
}

const UploadedFiles: React.FC = () => {
  const fetchAudioJobs = useQuery({
    queryKey: ['getAudioFiles'],
    queryFn: async () => {
      const apiURL = `${baseApiURL}/jobs`;
      const response = await fetch(apiURL);
      return response.json();
    }
  });

  return (
    <div className="audio-files">
      <h1>Uploaded files</h1>
      {fetchAudioJobs?.data?.length > 0 ? (
        <table className="audio-files-table">
          <thead>
          <tr>
            <th>File key</th>
            <th>Created at</th>
            <th>Status</th>
          </tr>
          </thead>
          <tbody>
          {fetchAudioJobs.data.map((job: AudioJobDto) => (
            <tr key={job.id}>
              <td>{job.fileName}</td>
              <td>{new Date(job.createdAt).toLocaleString()}</td>
              <td className={`job-status-${job.status.toLowerCase()}`}>{job.status}</td>
            </tr>
          ))}
          </tbody>
        </table>
      ) : (
        <p>No files uploaded</p>
      )}
      {fetchAudioJobs.isLoading && <p>Loading...</p>}
      <button onClick={() => fetchAudioJobs.refetch()}>Refresh</button>
    </div>
  )
}

export default App;
