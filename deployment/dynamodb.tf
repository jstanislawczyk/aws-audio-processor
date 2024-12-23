resource "aws_dynamodb_table" "audio_job" {
  name         = "${local.project}-audio-job"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
}
