// 푸터 컴포넌트 - 서버 컴포넌트로 유지 (상호작용 없음)
export default function Footer() {
  return (
    <footer className="mt-12 border-t">
      <div className="container mx-auto px-4 py-6">
        <p className="text-muted-foreground text-center text-sm">
          © 2026 AI 문서 생성 POC | Proof of Concept Application
        </p>
      </div>
    </footer>
  )
}
