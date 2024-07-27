resource "aws_s3_bucket" "audio" {
  bucket        = "${local.project}-audio-bucket"
  force_destroy = true
}

resource "aws_s3_bucket_notification" "upload_notification" {
  bucket = aws_s3_bucket.audio.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.audio_upload_consumer.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
  }
}
