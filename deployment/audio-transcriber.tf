resource "aws_lambda_function" "audio_transcriber" {
  function_name = "${local.project}-audio-transcriber"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  role          = aws_iam_role.audio_transcriber.arn
  filename      = data.archive_file.audio_transcriber.output_path

  source_code_hash = data.archive_file.audio_transcriber.output_base64sha256

  environment {
    variables = {
      REGION = local.region
    }
  }
}

resource "aws_iam_role" "audio_transcriber" {
  name               = "audio-transcriber"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role_policy_attachment" "audio_transcriber_role_attachment" {
  role       = aws_iam_role.audio_transcriber.name
  policy_arn = aws_iam_policy.audio_transcriber_policy.arn
}

resource "aws_iam_policy" "audio_transcriber_policy" {
  name = "${local.project}-audio-transcriber"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:${local.region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "transcribe:StartTranscriptionJob"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket",
        "s3:PutObject"
      ],
      "Resource": [
        "${aws_s3_bucket.audio.arn}",
        "${aws_s3_bucket.audio.arn}/*"
      ]
    }
  ]
}
EOF
}

data "archive_file" "audio_transcriber" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambdas/audio-transcriber/dist"
  output_path = "artifacts/audio-transcriber.zip"
}
