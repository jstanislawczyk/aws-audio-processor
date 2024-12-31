resource "aws_s3_bucket" "audio" {
  bucket        = "${local.project}-audio-bucket"
  force_destroy = true
}

resource "aws_s3_bucket_cors_configuration" "example" {
  bucket = aws_s3_bucket.audio.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT"]
    allowed_origins = ["*"]
    expose_headers  = []
  }
}

resource "aws_s3_bucket_notification" "upload_notification" {
  bucket = aws_s3_bucket.audio.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.audio_upload_consumer.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploaded/"
  }

  lambda_function {
    lambda_function_arn = aws_lambda_function.transcribe_files_consumer.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "processed/"
    filter_suffix       = "transcription.json"
  }
}

locals {
  path_to_intro = "${path.module}/intro/intro.mp3"
}

resource "aws_s3_object" "intro" {
  bucket = aws_s3_bucket.audio.id
  key    = "intro/intro.mp3"
  source = local.path_to_intro
  etag   = filemd5(local.path_to_intro)
}
