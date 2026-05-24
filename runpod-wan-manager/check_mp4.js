const ffmpeg = require('fluent-ffmpeg');
const ffprobeStatic = require('ffprobe-static');

ffmpeg.setFfprobePath(ffprobeStatic.path);

const file = 'F:\\workspace\\ComfyUI\\output\\wan_test_00002_.mp4';

ffmpeg.ffprobe(file, (err, metadata) => {
  if (err) {
    console.error('Error probing file:', err);
    process.exit(1);
  }
  const stream = metadata.streams.find(s => s.codec_type === 'video');
  const format = metadata.format;
  
  console.log('--- MP4 METADATA ---');
  console.log('File:', file);
  console.log('Format:', format.format_name);
  console.log('Size:', format.size, 'bytes');
  console.log('Duration:', format.duration, 'seconds');
  console.log('Resolution:', `${stream.width}x${stream.height}`);
  console.log('FPS:', stream.r_frame_rate || stream.avg_frame_rate);
  console.log('Codec:', stream.codec_name);
});
