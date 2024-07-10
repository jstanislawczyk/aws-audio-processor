resource "aws_s3_bucket" "audio" {
  bucket = "${local.project}-audio-bucket"
}
