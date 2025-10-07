import { useState, useRef } from 'react'

export default function VoiceRecorder({ onSubmit, disabled }) {
  const [recording, setRecording] = useState(false)
  const [permission, setPermission] = useState(true)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = (e) => chunksRef.current.push(e.data)
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' })
        onSubmit(blob)
        // stop all tracks
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      setRecording(true)
    } catch (e) {
      console.error(e)
      setPermission(false)
    }
  }

  function stop() {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.stop()
      setRecording(false)
    }
  }

  return (
    <div>
      {!permission && <div className="text-red-600 mb-2">Microphone permission denied.</div>}
      <div className="flex items-center gap-3">
        {!recording ? (
          <button onClick={start} disabled={disabled} className="px-5 py-2 bg-green-600 text-white rounded shadow">
            Start Recording
          </button>
        ) : (
          <button onClick={stop} className="px-5 py-2 bg-red-600 text-white rounded shadow">
            Stop & Submit
          </button>
        )}
        <div>
          <small className="text-gray-500">Click start, speak, then click stop to submit.</small>
        </div>
      </div>
    </div>
  )
}
