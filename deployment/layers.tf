resource "aws_lambda_layer_version" "ffmpeg" {
  # You must build the layer before deploying it. Download the ffmpeg binary and place it in the layers/ directory.
  # It must be in root of the zip file.
  filename    = "./layers/ffmpeg.zip"
  layer_name  = "${local.project}-ffmpeg"
  description = "A layer containing the ffmpeg binary"

  compatible_runtimes = ["nodejs20.x"]
}

resource "aws_lambda_layer_version" "ffprobe" {
  # You must build the layer before deploying it. Download the ffprobe binary and place it in the layers/ directory.
  # It must be in root of the zip file.
  filename    = "./layers/ffprobe.zip"
  layer_name  = "${local.project}-ffprobe"
  description = "A layer containing the ffprobe binary"

  compatible_runtimes = ["nodejs20.x"]
}

